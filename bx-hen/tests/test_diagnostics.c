#include "bx_diagnostics.h"

#include <assert.h>
#include <stdio.h>
#include <string.h>

static void check(const char *ua, bool detected, bool target) {
    bx_firmware_info f;
    bool success = bx_parse_ps4_firmware(ua, &f);
    assert(success == detected);
    assert(f.detected == detected);
    assert(f.matches_target == target);
}

int main(void) {
    bx_firmware_info f;
    bx_diagnostic_report report;
    char text[512];
    check("Mozilla/5.0 (PlayStation 4 13.53) AppleWebKit", true, true);
    check("Mozilla/5.0 (PlayStation 4/13.53) AppleWebKit", true, true);
    check("Mozilla/5.0 (PlayStation 4 14.00) AppleWebKit", true, false);
    check("Mozilla/5.0 (PlayStation 4 13.52)", true, false);
    check("Mozilla/5.0 (Windows NT 10.0)", false, false);
    check("PlayStation 4 13.530", false, false);
    check("PlayStation 4 13.53.1", false, false);
    check("PlayStation 4 13.5a", false, false);
    check("PlayStation 4 999999999999.53", false, false);
    check("PlayStation 4", false, false);
    assert(!bx_parse_ps4_firmware("PlayStation 4 13.53", NULL));
    assert(!bx_parse_ps4_firmware(NULL, &f));
    bx_collect_diagnostics("PlayStation 4 13.53", &report);
    bx_format_diagnostics(&report, text, sizeof(text));
    assert(strstr(text, "13.53") != NULL);
    assert(strstr(text, "nenhum jailbreak") != NULL);
    puts("BX-HEN diagnostics tests: OK");
    return 0;
}
