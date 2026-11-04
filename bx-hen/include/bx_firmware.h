#ifndef BX_FIRMWARE_H
#define BX_FIRMWARE_H

#include <stdbool.h>
#include <stddef.h>

#define BX_FW_MAJOR_TARGET 13u
#define BX_FW_MINOR_TARGET 53u

typedef struct {
    unsigned major;
    unsigned minor;
    bool is_ps4;
    bool detected;
    bool matches_target;
} bx_firmware_info;

/* Returns false for malformed/ambiguous strings. This is identification only. */
bool bx_parse_ps4_firmware(const char *user_agent, bx_firmware_info *out);

#endif
