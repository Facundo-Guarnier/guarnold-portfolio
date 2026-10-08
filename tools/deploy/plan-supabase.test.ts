import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * La lógica que decide QUÉ se despliega a Supabase. Sin red: si esto se equivoca, se aplica algo
 * en producción que ⊥ debía (o se saltea algo que sí).
 *
 * 🔗 `docs/guides/despliegue-supabase.md`
 */

// La raíz se busca hacia arriba: este archivo vive en `tools/deploy/` en la plantilla y en
// `tests/unit/deploy/` en el piloto, y tiene que ser idéntico en los dos lados.
function raizDelRepo() {
  let d = dirname(fileURLToPath(import.meta.url));
  while (!existsSync(join(d, "package.json"))) {
    const arriba = resolve(d, "..");
    if (arriba === d) throw new Error("⊥ encontré package.json");
    d = arriba;
  }
  return d;
}
const {
  leerMigracionesLocales,
  planificarMigraciones,
  controlDeTransaccion,
  sqlParaAplicar,
  leerFunctionsLocales,
  functionsAfectadas,
  secretosLeidosEnCodigo,
  revisarSecretos,
  nombreDePromocion,
  planificarAuth,
} = await import(pathToFileURL(join(raizDelRepo(), "tools/deploy/plan-supabase.mjs")).href);

const mig = (version: string, nombre: string) => ({
  version,
  nombre,
  archivo: `${version}_${nombre}.sql`,
});

describe("planificarMigraciones", () => {
  it("pendiente = local que ⊥ está en la base", () => {
    const p = planificarMigraciones(
      [mig("20260101000000", "a"), mig("20260201000000", "b")],
      [{ version: "20260101000000", name: "a" }],
    );
    expect(p.pendientes.map((m: { nombre: string }) => m.nombre)).toEqual(["b"]);
    expect(p.fueraDeOrden).toEqual([]);
  });

  it("las versiones de OTROS repos ⊥ vuelven viejo un pendiente legítimo", () => {
    // pivot aplicó algo en octubre; guarnote tiene un pendiente de septiembre posterior a lo
    // último SUYO aplicado → ⊥ es fuera de orden.
    const p = planificarMigraciones(
      [mig("20260901000000", "gn_vieja"), mig("20260915000000", "gn_nueva")],
      [
        { version: "20260901000000", name: "gn_vieja" },
        { version: "20261003000000", name: "pivot_algo" },
      ],
    );
    expect(p.pendientes.map((m: { nombre: string }) => m.nombre)).toEqual(["gn_nueva"]);
    expect(p.fueraDeOrden).toEqual([]);
  });

  it("caso pivot: historial de otro proyecto, más viejo que lo aplicado → fuera de orden", () => {
    const p = planificarMigraciones(
      [
        mig("20240730100000", "create_learning_map_schema"),
        mig("20260115004931", "create_pivot_schema"),
      ],
      [{ version: "20260115004931", name: "create_pivot_schema" }],
    );
    expect(p.fueraDeOrden.map((m: { nombre: string }) => m.nombre)).toEqual([
      "create_learning_map_schema",
    ]);
  });

  it("caso cv-formatter: mismo nombre aplicado con otra versión → detectado", () => {
    const p = planificarMigraciones(
      [mig("20260114000000", "create_cv_formatter_schema")],
      [{ version: "20260115000436", name: "create_cv_formatter_schema" }],
    );
    expect(p.mismoNombreOtraVersion).toEqual([
      {
        local: mig("20260114000000", "create_cv_formatter_schema"),
        versionRemota: "20260115000436",
      },
    ]);
  });

  it("repo sin nada aplicado: todo pendiente, nada fuera de orden", () => {
    const p = planificarMigraciones(
      [mig("20260101000000", "a")],
      [{ version: "20261001000000", name: "otra_app" }],
    );
    expect(p.pendientes).toHaveLength(1);
    expect(p.fueraDeOrden).toEqual([]);
  });
});

describe("leerMigracionesLocales", () => {
  it("separa los nombres que ⊥ siguen el formato (el de cv-formatter, de 8 dígitos)", () => {
    const d = mkdtempSync(join(tmpdir(), "mig-"));
    writeFileSync(join(d, "20261002235100_ok.sql"), "");
    writeFileSync(join(d, "20260114_create_cv_formatter_schema.sql"), "");
    writeFileSync(join(d, "README.md"), "");
    const r = leerMigracionesLocales(d);
    expect(r.migraciones.map((m: { version: string }) => m.version)).toEqual(["20261002235100"]);
    expect(r.invalidos).toEqual(["20260114_create_cv_formatter_schema.sql"]);
  });
});

describe("controlDeTransaccion", () => {
  it("detecta BEGIN/COMMIT sueltos", () => {
    expect(controlDeTransaccion("BEGIN;\ncreate table x();\nCOMMIT;")).toEqual([
      "BEGIN;",
      "COMMIT;",
    ]);
  });
  it("⊥ confunde el BEGIN de un cuerpo PL/pgSQL ni un comentario", () => {
    const sql = `-- BEGIN;\nCREATE FUNCTION f() RETURNS void LANGUAGE plpgsql AS $$\nBEGIN\n  RETURN;\nEND;\n$$;\nDO $x$ BEGIN PERFORM 1; END $x$;`;
    expect(controlDeTransaccion(sql)).toEqual([]);
  });
});

describe("sqlParaAplicar", () => {
  it("candado, archivo y registro en UNA consulta, con el archivo intacto", () => {
    const sql = "create table t(a text default 'x');";
    const s = sqlParaAplicar(mig("20261004000000", "crear_t"), sql);
    expect(s.indexOf("pg_advisory_xact_lock")).toBeLessThan(s.indexOf("create table t"));
    expect(s.indexOf("create table t")).toBeLessThan(
      s.indexOf("INSERT INTO supabase_migrations.schema_migrations"),
    );
    expect(s).toContain("VALUES ('20261004000000', $despliegue0$crear_t$despliegue0$");
  });
  it("el dollar-quote ⊥ choca con uno que ya esté en el archivo", () => {
    const s = sqlParaAplicar(mig("20261004000000", "x"), "select $despliegue0$hola$despliegue0$;");
    expect(s).toContain("$despliegue1$x$despliegue1$");
  });
  it("rechaza una versión que ⊥ sea de 14 dígitos (iría interpolada al SQL)", () => {
    expect(() => sqlParaAplicar({ version: "1'; drop table x; --", nombre: "x" }, "")).toThrow();
  });
});

describe("functionsAfectadas", () => {
  const locales = ["gn-a", "gn-b", "gn-c"];
  it("sin punto de partida → todas", () => {
    expect(functionsAfectadas(null, locales).desplegar).toEqual(locales);
  });
  it("solo las carpetas tocadas", () => {
    const r = functionsAfectadas(["supabase/functions/gn-b/index.ts", "src/App.tsx"], locales);
    expect(r.desplegar).toEqual(["gn-b"]);
    expect(r.todas).toBe(false);
  });
  it("código compartido o config.toml → todas", () => {
    expect(functionsAfectadas(["supabase/functions/_shared/x.ts"], locales).desplegar).toEqual(
      locales,
    );
    expect(functionsAfectadas(["supabase/config.toml"], locales).desplegar).toEqual(locales);
  });
  it("una function borrada se informa y ⊥ se intenta desplegar", () => {
    const r = functionsAfectadas(["supabase/functions/gn-vieja/index.ts"], locales);
    expect(r.desplegar).toEqual([]);
    expect(r.borradas).toEqual(["gn-vieja"]);
  });
  it("una migración ⊥ despliega ninguna function", () => {
    expect(
      functionsAfectadas(["supabase/migrations/20261004000000_x.sql"], locales).desplegar,
    ).toEqual([]);
  });
});

describe("secretos", () => {
  it("lee los literales del código, ⊥ los tests", () => {
    const d = mkdtempSync(join(tmpdir(), "fn-"));
    mkdirSync(join(d, "gn-a"));
    mkdirSync(join(d, "_shared"));
    writeFileSync(join(d, "gn-a", "index.ts"), "Deno.env.get('UNO'); Deno.env.get(\"DOS\") ?? ''");
    writeFileSync(join(d, "_shared", "x.ts"), "Deno.env.get(`TRES`)");
    writeFileSync(join(d, "gn-a", "index.test.ts"), "Deno.env.get('DE_TEST')");
    expect([...secretosLeidosEnCodigo(d)].sort()).toEqual(["DOS", "TRES", "UNO"]);
    expect(leerFunctionsLocales(d)).toEqual(["gn-a"]);
  });

  it("lo que el código lee y el manifiesto ⊥ declara frena; los de Supabase ⊥ se declaran", () => {
    const r = revisarSecretos(
      { requeridos: ["A"], opcionales: ["B"] },
      new Set(["A", "B", "C", "SUPABASE_URL"]),
      new Set(["A"]),
    );
    expect(r.sinDeclarar).toEqual(["C"]);
    expect(r.faltan).toEqual([]);
  });

  it("requerido sin setear en el proyecto → falta; opcional sin setear ⊥", () => {
    const r = revisarSecretos(
      { requeridos: ["A", "W"], opcionales: ["B"] },
      new Set(),
      new Set(["A"]),
    );
    expect(r.faltan).toEqual(["W"]);
  });
});

describe("nombreDePromocion", () => {
  const ahora = new Date(Date.UTC(2026, 9, 4, 18, 30, 5));
  it("versión = hora UTC de la promoción", () => {
    expect(nombreDePromocion("pivot_tengo_acceso", ahora, ["20261003000405"])).toBe(
      "20261004183005_pivot_tengo_acceso.sql",
    );
  });
  it("siempre POSTERIOR a la última local, aunque el reloj diga otra cosa", () => {
    expect(nombreDePromocion("x", ahora, ["20261004183005"])).toBe("20261004183006_x.sql");
    expect(nombreDePromocion("x", ahora, ["20261231235959"])).toBe("20270101000000_x.sql");
  });
  it("rechaza descripciones que ⊥ son snake_case", () => {
    expect(() => nombreDePromocion("Add-Column", ahora, [])).toThrow();
    expect(() => nombreDePromocion("20261004_x", ahora, [])).toThrow();
  });
});

describe("planificarAuth", () => {
  const actual: Record<string, unknown> = {
    jwt_exp: 3600,
    password_min_length: 6,
    mfa_totp_enroll_enabled: true,
    smtp_pass: null,
  };
  it("solo las claves declaradas que difieren; comentarios ⊥ cuentan", () => {
    const r = planificarAuth(
      { $comentario: "x", porque: "y", jwt_exp: 600, mfa_totp_enroll_enabled: true },
      actual,
    );
    expect(r.cambios).toEqual([{ clave: "jwt_exp", actual: 3600, deseado: 600 }]);
    expect(r.desconocidas).toEqual([]);
  });
  it("una clave que el proyecto ⊥ tiene es un typo, ⊥ un cambio", () => {
    const r = planificarAuth({ jwt_expiry: 600 }, actual);
    expect(r.desconocidas).toEqual(["jwt_expiry"]);
    expect(r.cambios).toEqual([]);
  });
  it("las claves secretas se rechazan y ⊥ se mandan", () => {
    const r = planificarAuth({ smtp_pass: "hunter2", external_google_secret: "x" }, actual);
    expect(r.secretas.sort()).toEqual(["external_google_secret", "smtp_pass"]);
    expect(r.cambios).toEqual([]);
  });
});
