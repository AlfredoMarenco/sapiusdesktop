// Control de navegación y carga dinámica de componentes HTML

export async function loadView(viewName) {
    try {
        const response = await fetch(`./components/${viewName}.html`);
        if (!response.ok) throw new Error(`Fallo al cargar plantilla ${viewName}`);
        const html = await response.text();
        document.getElementById('main-content-pane').innerHTML = html;
        return true;
    } catch (e) {
        console.error("Error al cargar vista dinámica:", e);
        document.getElementById('main-content-pane').innerHTML = `
            <div style="padding:2rem; text-align:center; color:var(--danger-red);">
                Error al cargar el panel: ${e.message}
            </div>
        `;
        return false;
    }
}

export function initNavigation(onViewChanged) {
    const navItems = document.querySelectorAll('.nav-item');
    const viewTitle = document.getElementById('view-title');

    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const targetView = item.getAttribute('data-view');

            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Actualizar Título del Header
            viewTitle.innerText = item.querySelector('span:last-child').innerText;

            // Disparar callback para inicializar el módulo correspondiente
            if (onViewChanged) {
                await onViewChanged(targetView);
            }
        });
    });
}
