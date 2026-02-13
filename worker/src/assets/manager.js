/**
 * 静态资源管理器模块
 * @module assets/manager
 */

import { resolveAuthPayload } from '../middleware/auth.js';

/**
 * 静态资源管理器
 */
export class AssetManager {
  constructor() {

    this.protectedPaths = new Set([
      '/admin.html',
      '/admin',
      '/html/mailboxes.html',
      '/mailbox.html',
      '/html/mailbox.html'
    ]);

    this.guestOnlyPaths = new Set([
      '/login',
      '/login.html'
    ]);
  }

  isProtectedPath(pathname) {
    return this.protectedPaths.has(pathname) || 
           pathname.startsWith('/admin/') || 
           pathname.startsWith('/mailbox/');
  }

  isGuestOnlyPath(pathname) {
    return this.guestOnlyPaths.has(pathname);
  }

  async handleAssetRequest(request, env, mailDomains) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const JWT_TOKEN = env.JWT_TOKEN || env.JWT_SECRET || '';

    // If request has prefix /api/, ignore it (should have been handled by router)
    // But since this is the fallback for router, if it persists here, it means 404 API.
    if (pathname.startsWith('/api/')) {
      return new Response('API Not Found', { status: 404 });
    }

    if (this.isProtectedPath(pathname)) {
      const authResult = await this.checkProtectedPathAuth(request, JWT_TOKEN, url);
      if (authResult) return authResult;
    }

    if (this.isGuestOnlyPath(pathname)) {
      const guestResult = await this.checkGuestOnlyPath(request, JWT_TOKEN, url);
      if (guestResult) return guestResult;
    }

    if (!env.ASSETS || !env.ASSETS.fetch) {
      // Fallback for local dev without binding?
      return new Response('Assets binding not found', { status: 500 });
    }

    // Determine if it is a file request (has extension) or a route request
    const isFile = pathname.includes('.') && !pathname.endsWith('.html'); 
    
    // Allow .html files to fall through to specific handlers or asset fetch
    // But map SPA routes to index.html
    if (pathname === '/admin.html' || pathname === '/admin') {
      return await this.handleAdminPage(mappedRequest, env, JWT_TOKEN);
    }

    if (pathname === '/mailbox.html' || pathname === '/html/mailbox.html') {
      return await this.handleMailboxPage(this.handlePathMapping(request, url), env, JWT_TOKEN);
    }
    
    if (pathname === '/mailboxes.html' || pathname === '/html/mailboxes.html') {
      return await this.handleAllMailboxesPage(this.handlePathMapping(request, url), env, JWT_TOKEN);
    }

    // If it looks like a static asset, serve it directly
    if (isFile) {
      return env.ASSETS.fetch(request);
    }

    // Otherwise, treat as SPA route -> index.html
    // Exclude .html files that are not special pages (though usually SPA doesn't have other .html files)
    if (pathname.endsWith('.html')) {
        return env.ASSETS.fetch(request);
    }

    // SPA Fallback: Serve index.html
    // We map the request to /index.html
    const indexRequest = new Request(new URL('/index.html', url).toString(), request);
    return await this.handleIndexPage(indexRequest, env, mailDomains, JWT_TOKEN);
  }

  async handleIllegalPath(request, env, JWT_TOKEN) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // SPA routes that should serve index.html
    const spaRoutes = ['/dashboard', '/mailbox', '/login', '/send'];
    const isSpaRoute = spaRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

    if (isSpaRoute) {
      // Serve index.html for SPA routes
    if (isSpaRoute) {
      // Serve index.html for SPA routes
      const indexRequest = new Request(new URL('/', url).toString(), request);
      return env.ASSETS.fetch(indexRequest);
    }
    }

    const payload = await resolveAuthPayload(request, JWT_TOKEN);

    if (payload !== false) {
      if (payload.role === 'mailbox') {
        return Response.redirect(new URL('/mailbox', url).toString(), 302);
      } else {
        return Response.redirect(new URL('/', url).toString(), 302);
      }
    }

    return Response.redirect(new URL('/login', url).toString(), 302);
  }

  async checkProtectedPathAuth(request, JWT_TOKEN, url) {
    const payload = await resolveAuthPayload(request, JWT_TOKEN);

    if (!payload) {
      const loading = new URL('/templates/loading.html', url);
      if (url.pathname.includes('mailbox')) {
        loading.searchParams.set('redirect', '/html/mailbox.html');
      } else {
        loading.searchParams.set('redirect', '/admin.html');
      }
      return Response.redirect(loading.toString(), 302);
    }

    if (url.pathname.includes('mailbox')) {
      if (payload.role !== 'mailbox') {
        return Response.redirect(new URL('/', url).toString(), 302);
      }
      if (url.pathname === '/' || url.pathname === '/index.html') {
        return Response.redirect(new URL('/html/mailbox.html', url).toString(), 302);
      }
    } else {
      const isAllowed = (payload.role === 'admin' || payload.role === 'guest' || payload.role === 'mailbox');
      if (!isAllowed) {
        return Response.redirect(new URL('/', url).toString(), 302);
      }
    }

    return null;
  }

  async checkGuestOnlyPath(request, JWT_TOKEN, url) {
    const payload = await resolveAuthPayload(request, JWT_TOKEN);

    if (payload !== false) {
      return Response.redirect(new URL('/', url).toString(), 302);
    }

    return null;
  }

  handlePathMapping(request, url) {
    let targetUrl = url.toString();

    const spaRoutes = ['/login', '/dashboard', '/mailbox', '/compose', '/sent', '/settings'];
    if (spaRoutes.includes(url.pathname)) {
      // SPA route: serve index.html
      targetUrl = new URL('/index.html', url).toString();
    }
    if (url.pathname === '/admin') {
      targetUrl = new URL('/html/admin.html', url).toString();
    }
    else if (url.pathname === '/admin.html') {
      targetUrl = new URL('/html/admin.html', url).toString();
    }
    else if (url.pathname === '/mailbox') {
      // NOTE: Original logic had /mailbox -> /html/mailbox.html, but SPA might use /mailbox too?
      // If SPA uses /mailbox, we shouldn't map it to /html/mailbox.html unless it's the legacy page.
      // Current usage suggests /mailbox is an SPA route for user dashboard?
      // Let's assume /html/mailbox.html is the legacy one and verify.
      // For now, mapping /mailbox to /html/mailbox.html seems consistent with original intent for "protected" path.
      // But if /mailbox is an SPA route, this breaks it.
      // The original code listed /mailbox in "spaRoutes" AND used it for redirection.
      // Let's rely on the caller passing mapped URL for specific pages, but for SPA, we map to /index.html.
      
      // If we are here, it's called by handleMailboxPage or handleAdminPage whic pass the mapped request.
      // For generic SPA routes, handleAssetRequest constructs indexRequest manually.
      targetUrl = new URL('/html/mailbox.html', url).toString();
    }
    else if (url.pathname === '/mailbox.html') {
      targetUrl = new URL('/html/mailbox.html', url).toString();
    }
    else if (url.pathname === '/mailboxes.html') {
      targetUrl = new URL('/html/mailboxes.html', url).toString();
    }

    return new Request(targetUrl, request);
  }

  async handleIndexPage(request, env, mailDomains, JWT_TOKEN) {
    const url = new URL(request.url);
    const payload = await resolveAuthPayload(request, JWT_TOKEN);

    if (payload && payload.role === 'mailbox') {
      return Response.redirect(new URL('/html/mailbox.html', url).toString(), 302);
    }

    // Directly return the asset response to avoid stream consumption issues
    // The meta injection logic was targeting a non-existent tag anyway
    return await env.ASSETS.fetch(request);
  }

  async handleAdminPage(request, env, JWT_TOKEN) {
    const url = new URL(request.url);
    const payload = await resolveAuthPayload(request, JWT_TOKEN);

    if (!payload) {
      const loadingReq = new Request(
        new URL('/templates/loading.html?redirect=%2Fadmin.html', url).toString(),
        request
      );
      return env.ASSETS.fetch(loadingReq);
    }

    const isAllowed = (payload.role === 'admin' || payload.role === 'guest' || payload.role === 'mailbox');
    if (!isAllowed) {
      return Response.redirect(new URL('/', url).toString(), 302);
    }

    return env.ASSETS.fetch(request);
  }

  async handleMailboxPage(request, env, JWT_TOKEN) {
    const url = new URL(request.url);
    const payload = await resolveAuthPayload(request, JWT_TOKEN);

    if (!payload) {
      const loadingReq = new Request(
        new URL('/templates/loading.html?redirect=%2Fhtml%2Fmailbox.html', url).toString(),
        request
      );
      return env.ASSETS.fetch(loadingReq);
    }

    if (payload.role !== 'mailbox') {
      if (payload.role === 'admin' || payload.role === 'guest') {
        return Response.redirect(new URL('/', url).toString(), 302);
      } else {
        return Response.redirect(new URL('/login.html', url).toString(), 302);
      }
    }

    return env.ASSETS.fetch(request);
  }

  async handleAllMailboxesPage(request, env, JWT_TOKEN) {
    const url = new URL(request.url);
    const payload = await resolveAuthPayload(request, JWT_TOKEN);
    if (!payload) {
      const loadingReq = new Request(
        new URL('/templates/loading.html?redirect=%2Fhtml%2Fmailboxes.html', url).toString(),
        request
      );
      return env.ASSETS.fetch(loadingReq);
    }
    const isStrictAdmin = (payload.role === 'admin' && (payload.username === '__root__' || payload.username));
    const isGuest = (payload.role === 'guest');
    if (!isStrictAdmin && !isGuest) {
      return Response.redirect(new URL('/', url).toString(), 302);
    }
    return env.ASSETS.fetch(request);
  }

  isApiPath(pathname) {
    return pathname.startsWith('/api/') || pathname === '/receive';
  }

  getAccessLog(request) {
    const url = new URL(request.url);
    return {
      timestamp: new Date().toISOString(),
      method: request.method,
      path: url.pathname,
      userAgent: request.headers.get('User-Agent') || '',
      referer: request.headers.get('Referer') || '',
      ip: request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For') ||
        request.headers.get('X-Real-IP') || 'unknown'
    };
  }
}

/**
 * 创建默认的资源管理器实例
 * @returns {AssetManager} 资源管理器实例
 */
export function createAssetManager() {
  return new AssetManager();
}
