export function toggleSidebar(this: any) {
    this.sidebarCollapsed = !this.sidebarCollapsed;

    const container = document.querySelector('.todoist-task-container');
    if (!container) return;

    const sidebar = container.querySelector('.task-sidebar') as HTMLElement;
    const mainContent = container.querySelector('.main-content') as HTMLElement;
    const collapsedToggle = container.querySelector('.collapsed-toggle') as HTMLElement;
    const toggleButtonInside = container.querySelector('.sidebar-toggle-button') as HTMLElement;

    if (sidebar && mainContent && collapsedToggle) {
        sidebar.style.transform = `translateX(${this.sidebarCollapsed ? '-200px' : '0'})`;
        mainContent.style.marginLeft = this.sidebarCollapsed ? '0' : '200px';
        collapsedToggle.style.left = this.sidebarCollapsed ? '8px' : '-40px';
        collapsedToggle.style.opacity = this.sidebarCollapsed ? '1' : '0';
        collapsedToggle.style.pointerEvents = this.sidebarCollapsed ? 'auto' : 'none';

        if (toggleButtonInside) {
            toggleButtonInside.innerHTML = this.sidebarCollapsed ? '▶' : '◀';
        }
        collapsedToggle.innerHTML = this.sidebarCollapsed ? '▶' : '◀';
    }
}

export function injectSidebarStyles() {
    if (document.getElementById('todoist-sidebar-styles')) return;

    const style = document.createElement('style');
    style.id = 'todoist-sidebar-styles';
    style.textContent = `
        .todoist-task-container {
            position: relative !important;
            overflow: visible !important;
        }

        .task-sidebar {
            position: absolute !important;
            z-index: 100 !important;
        }

        .collapsed-toggle {
            position: absolute !important;
            z-index: 101 !important;
        }

        @media (max-width: 768px) {
            .task-sidebar {
                width: 250px !important;
            }

            .main-content {
                margin-left: 0 !important;
            }

            .collapsed-toggle {
                left: 8px !important;
            }
        }

        .task-sidebar::-webkit-scrollbar {
            width: 4px;
        }

        .task-sidebar::-webkit-scrollbar-track {
            background: #f1f1f1;
        }

        .task-sidebar::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 2px;
        }

        .task-sidebar::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
        }

        .task-sidebar, .main-content, .collapsed-toggle {
            transition: all 0.3s ease !important;
        }
    `;

    document.head.appendChild(style);
}
