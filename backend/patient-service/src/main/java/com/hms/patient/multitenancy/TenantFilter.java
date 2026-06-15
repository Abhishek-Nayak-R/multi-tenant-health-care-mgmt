package com.hms.patient.multitenancy;

import com.hms.patient.util.JwtUtil;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TenantFilter implements Filter {

    private static final String TENANT_HEADER = "X-TenantID";
    private final JwtUtil jwtUtil;

    public TenantFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String tenantId = null;

        // 1. Try to extract from JWT authorization token first
        String authHeader = httpRequest.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                tenantId = jwtUtil.extractTenantId(token);
            } catch (Exception e) {
                // Token invalid or parsing failed, ignore and try header
            }
        }

        // 2. Fallback to X-TenantID header
        if (tenantId == null) {
            tenantId = httpRequest.getHeader(TENANT_HEADER);
        }

        // 3. Bind to thread local context
        if (tenantId != null && !tenantId.trim().isEmpty()) {
            TenantContext.setCurrentTenant(tenantId);
        } else {
            // Default tenant for unauthenticated static resources or endpoints (if any)
            TenantContext.setCurrentTenant("public");
        }

        try {
            chain.doFilter(request, response);
        } finally {
            // Crucial: Clear thread local context to prevent leakage in Thread Pool
            TenantContext.clear();
        }
    }
}
