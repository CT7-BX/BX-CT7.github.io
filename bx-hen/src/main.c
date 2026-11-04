#include "bx_diagnostics.h"

#include <stdio.h>

int main(int argc, char **argv) {
    bx_diagnostic_report report;
    char output[512];
    if (argc != 2) {
        fprintf(stderr, "Uso: %s '<User-Agent do PS4>'\n", argv[0]);
        return 2;
    }
    bx_collect_diagnostics(argv[1], &report);
    bx_format_diagnostics(&report, output, sizeof(output));
    fputs(output, stdout);
    return report.firmware.detected ? 0 : 1;
}
