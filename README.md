# Mi Dinero+

**Mi Dinero+** es una plataforma web de simulación financiera educativa,
desarrollada para el personal de Meta Autos Medellín. Permite practicar
hábitos básicos de administración del dinero mediante registros simulados,
sin operar con dinero real.

![Vista previa](assets/preview.png)

> Este repositorio contiene el **prototipo estático** del frontend (HTML5,
> CSS3 y JavaScript Vanilla), que define el contrato visual, la accesibilidad
> y la experiencia de usuario (UX/UI) del sistema. La versión de producción
> está siendo desarrollada en paralelo sobre React + Vite, con persistencia
> real en base de datos (ver `docs/ROADMAP_TECNICO.md`).

## Funcionalidades principales

- **Acceso y cuenta**: registro e inicio de sesión simulados, con
  validaciones en tiempo real (nombre, correo, contraseña).
- **Tablero principal**: balance de ingresos/gastos, resumen de ahorros y
  deudas, historial reciente.
- **Transacciones**: registro de ingresos y gastos, historial y balance.
- **Metas de ahorro**: creación de metas, aportes y seguimiento de progreso.
- **Gestión de deudas**: registro de obligaciones, abonos y simulador de
  amortización.
- **Asistente Financiero IA**: recomendaciones educativas contextuales según
  la actividad del usuario.
- **Mi Perfil**: identidad, progreso educativo, personalización de avatar,
  seguridad (cambio de contraseña/correo) y configuración de la simulación
  (moneda, nivel educativo, animaciones).
- **Modo claro/oscuro** y diseño responsive.

## Estructura del proyecto

```
MiDineroPlus/
├── index.html          # Punto de entrada
├── assets/
│   ├── css/style.css   # Estilos
│   ├── js/             # Lógica de cada módulo (auth, transactions, goals,
│   │                    debts, profile, assistant, ui, storage, utils...)
│   └── Img/             # Recursos gráficos
└── views/               # Vistas: login, registro, dashboard, transacciones,
                          # metas, deudas, perfil
docs/
└── ROADMAP_TECNICO.md   # Visión de arquitectura y plan hacia producción
```

## Cómo ejecutarlo

Al ser un frontend estático, no requiere instalación de dependencias:

1. Clona el repositorio.
2. Abre `MiDineroPlus/index.html` directamente en el navegador, o sírvelo
   con un servidor local (por ejemplo, la extensión "Live Server" de VS Code)
   para evitar restricciones del navegador con rutas locales.

## Tecnologías

- HTML5, CSS3, JavaScript (Vanilla)
- Persistencia de sesión mediante `sessionStorage` (en esta fase de
  prototipo; sin backend ni base de datos real)

## Roadmap

La visión de arquitectura para la versión de producción (React + Vite,
API RESTful, base de datos relacional) está documentada en
[`docs/ROADMAP_TECNICO.md`](docs/ROADMAP_TECNICO.md).

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo
[`LICENSE`](LICENSE) para más detalles.
