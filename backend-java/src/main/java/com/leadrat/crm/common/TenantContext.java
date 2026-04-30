package com.leadrat.crm.common;

import java.util.UUID;

public class TenantContext {
    private static final ThreadLocal<UUID> tenantId = new ThreadLocal<>();

    public static void set(UUID id) {
        tenantId.set(id);
    }

    public static UUID get() {
        return tenantId.get();
    }

    public static void clear() {
        tenantId.remove();
    }
}
