---
description: Resume el ultimo run de GitHub Actions y que fallo
allowed-tools: Bash(gh run list:*), Bash(gh run view:*), Bash(gh pr checks:*), Bash(gh api:*), Bash(git rev-parse:*), Bash(git branch:*)
---
1. `gh run list --limit 5` para ver los runs recientes. Si no hay ninguno, dilo (el workflow puede no haberse ejecutado nunca: rama sin pushear o Actions desactivado).
2. Toma el run más reciente de la rama actual (`git branch --show-current`). `gh run view <id>` para ver jobs.
3. Para cada job fallido: `gh run view <id> --log-failed` y extrae solo las líneas de error relevantes (no vuelques el log entero).
4. Resume:
   - Qué job/servicio falló (auth-service, route-matching-tests, frontend, etc.).
   - Causa concreta (test roto, dependencia, migración, lint).
   - Archivo y test señalados si aplica.
   - Arreglo sugerido en una frase.
5. Si todo pasó, una línea confirmándolo con el SHA.

No hagas cambios; solo diagnostica.
