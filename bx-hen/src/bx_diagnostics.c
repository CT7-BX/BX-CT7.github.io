#include "bx_diagnostics.h"

#include <stdio.h>
#include <string.h>

void bx_collect_diagnostics(const char *user_agent, bx_diagnostic_report *out) {
    if (!out) return;
    memset(out, 0, sizeof(*out));
    out->project_version = "BX-HEN diagnostic 0.1.0";
    out->host_platform = "portable userspace diagnostic";
    out->external_user_agent = 1;
    bx_parse_ps4_firmware(user_agent, &out->firmware);
}

void bx_format_diagnostics(const bx_diagnostic_report *report, char *buffer, size_t size) {
    const bx_firmware_info *f;
    if (!buffer || size == 0u) return;
    buffer[0] = '\0';
    if (!report) return;
    f = &report->firmware;
    if (!f->is_ps4) {
        snprintf(buffer, size,
            "%s\nPlataforma: nao identificada como PS4\nFirmware: desconhecido\n"
            "Status: diagnostico somente (nenhum jailbreak)\n",
            report->project_version);
    } else if (!f->detected) {
        snprintf(buffer, size,
            "%s\nPlataforma: PS4\nFirmware: nao identificado\n"
            "Status: diagnostico somente (nenhum jailbreak)\n",
            report->project_version);
    } else {
        snprintf(buffer, size,
            "%s\nPlataforma: PS4\nFirmware informado: %u.%02u\n"
            "Alvo 13.53: %s\n"
            "Status: diagnostico somente (nenhum jailbreak)\n",
            report->project_version, f->major, f->minor,
            f->matches_target ? "corresponde" : "nao corresponde");
    }
}
