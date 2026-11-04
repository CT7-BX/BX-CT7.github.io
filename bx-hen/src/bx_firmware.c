#include "bx_firmware.h"

#include <ctype.h>
#include <limits.h>
#include <string.h>

static bool parse_decimal(const char **cursor, unsigned *value) {
    const unsigned char *p = (const unsigned char *)*cursor;
    unsigned n = 0;
    if (!isdigit(*p)) return false;
    do {
        const unsigned d = (unsigned)(*p - '0');
        if (n > (UINT_MAX - d) / 10u) return false;
        n = n * 10u + d;
        ++p;
    } while (isdigit(*p));
    *cursor = (const char *)p;
    *value = n;
    return true;
}

/* Only report an explicit PlayStation 4 firmware version in the supplied UA. */
bool bx_parse_ps4_firmware(const char *user_agent, bx_firmware_info *out) {
    static const char marker[] = "PlayStation 4";
    const char *p;
    unsigned major = 0, minor = 0;
    if (!out) return false;
    memset(out, 0, sizeof(*out));
    if (!user_agent) return false;
    p = strstr(user_agent, marker);
    if (!p) return false;
    out->is_ps4 = true;
    p += sizeof(marker) - 1u;
    if (*p != '/' && *p != ' ') return false;
    ++p;
    if (!parse_decimal(&p, &major) || *p != '.') return false;
    ++p;
    if (!parse_decimal(&p, &minor)) return false;
    if (isdigit((unsigned char)*p) || *p == '.') return false;
    if (*p && *p != ')' && *p != ';' && *p != ' ' && *p != '/') return false;
    /* Firmware minor revisions in PS4 UA are two decimal digits. */
    if (major > 99u || minor > 99u) return false;
    out->major = major;
    out->minor = minor;
    out->detected = true;
    out->matches_target = major == BX_FW_MAJOR_TARGET &&
                          minor == BX_FW_MINOR_TARGET;
    return true;
}
