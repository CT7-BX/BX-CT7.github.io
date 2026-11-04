#ifndef BX_DIAGNOSTICS_H
#define BX_DIAGNOSTICS_H

#include <stddef.h>
#include "bx_firmware.h"

typedef struct {
    const char *project_version;
    const char *host_platform;
    bx_firmware_info firmware;
    int external_user_agent;
} bx_diagnostic_report;

void bx_collect_diagnostics(const char *user_agent, bx_diagnostic_report *out);
void bx_format_diagnostics(const bx_diagnostic_report *report, char *buffer, size_t size);

#endif
