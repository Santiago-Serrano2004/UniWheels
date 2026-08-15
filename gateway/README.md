# API Gateway y Proxy Inverso (gateway)

**Tecnología:** Nginx  

### Responsabilidades:
- Punto único de entrada perimetral para el frontend web y aplicaciones móviles.
- Enrutamiento inverso (*Reverse Proxy*) hacia cada microservicio interno.
- Gestión de políticas de CORS y limitación de tasa de peticiones (*Rate Limiting* `throttle:20,1`).
- Terminación SSL/TLS centralizada.
