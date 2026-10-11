/**
 * Convención de commits: `tipo(scope opcional): asunto`, en español, con los tipos de
 * Conventional Commits. Lo verifica el hook `commit-msg` (husky) al commitear.
 *
 * `ignores`: mensajes que NO escribe una persona, ∴ no deben fallar:
 *  - merges (`Merge …`, `Pase de dev a main`)
 *  - el de metadata que commitea el workflow `update-metadata` (`chore: update metadata … [skip ci]`)
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'chore', 'test', 'ci', 'refactor', 'build', 'style', 'perf', 'revert'],
    ],
    // El asunto va en español y el owner escribe en minúscula o mayúscula inicial: ⊥ se fuerza caso.
    'subject-case': [0],
    // Un cuerpo largo es legítimo (decisiones, hallazgos): ⊥ se corta por ancho de línea.
    'body-max-line-length': [0],
  },
  ignores: [
    (mensaje) => /^Merge /.test(mensaje),
    (mensaje) => /^Pase de dev a main/.test(mensaje),
    (mensaje) => /^chore: update metadata to .* \[skip ci\]$/.test(mensaje.split('\n')[0]),
  ],
}
