// ==========================================================
// NAV.JS — Floating Navigation Bar Component
// Injects navigation bar into all HBD pages
// ==========================================================

(function() {
    // Determine current page
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    const navItems = [
        { href: 'index.html', icon: '🏠', label: 'Home', pages: ['index.html', ''] },
        { href: 'memory-book.html', icon: '📖', label: 'Memories', pages: ['memory-book.html'] },
        { href: 'love-letters.html', icon: '💌', label: 'Letters', pages: ['love-letters.html'] },
        { href: 'surprise.html', icon: '🎮', label: 'Surprise', pages: ['surprise.html'] }
    ];

    const nav = document.createElement('nav');
    nav.className = 'float-nav';
    nav.id = 'floatNav';

    let inner = '<div class="float-nav-inner">';
    navItems.forEach(item => {
        const isActive = item.pages.includes(page);
        inner += `<a href="${item.href}" class="float-nav-item${isActive ? ' active' : ''}">
            <span class="nav-icon">${item.icon}</span>
            <span>${item.label}</span>
        </a>`;
    });
    inner += '</div>';
    nav.innerHTML = inner;

    // Insert nav into body
    document.body.appendChild(nav);
})();
