// BX-HEN Neon 0.1 - independent, read-only PS4 homebrew UI.
// Visual project version: BX-HEN v2.2. Customization credit: RUOK999.
// Does NOT modify GoldHEN, PS4 system settings, kernel, plugins or servers.
// Uses the OpenOrbis samples: font, input and _common/graphics.
#include <cstdio>
#include <sstream>
#include <orbis/libkernel.h>
#include "../../_common/graphics.h"
#include "../../_common/log.h"
#include "controller.h"

#define SCREEN_W 1920
#define SCREEN_H 1080
#define SCREEN_DEPTH 4
std::stringstream debugLogStream;

struct MenuItem {
    const char *name;
    const char *info;
};
static const MenuItem MENU[] = {
    {"Debug Settings", "Original console debug settings are not controlled by this app."},
    {"Cheat Settings", "This preview does not change cheats or game memory."},
    {"Plugin Settings", "Plugin management remains in the original system menu."},
    {"Game Overlay", "This preview is a separate app, not a system overlay."},
    {"Servers Settings", "No FTP, server or network service is started here."},
    {"Klog Settings", "Kernel logging is neither accessed nor modified."},
    {"Settings", "Design preview: navigation and visual settings only."},
    {"About", "BX-HEN v2.2 visual project. Customization: RUOK999."}
};
static const int MENU_COUNT = sizeof(MENU) / sizeof(MENU[0]);

static const Color BG = {5, 8, 27};
static const Color PANEL = {9, 14, 40};
static const Color CARD = {13, 21, 57};
static const Color CYAN = {19, 227, 251};
static const Color PURPLE = {205, 50, 246};
static const Color WHITE = {241, 246, 255};
static const Color MUTED = {157, 176, 212};
static const Color BLACK = {2, 4, 18};
static const Color NIGHT = {12, 9, 30};

static void label(Scene2D *scene, FT_Face face, const char *text,
                  int x, int y, Color background, Color foreground) {
    // OpenOrbis DrawText reads but does not change its char* argument.
    scene->DrawText(const_cast<char *>(text), face, x, y, background, foreground);
}
static void border(Scene2D *scene, int x, int y, int w, int h, Color edge, Color center) {
    scene->DrawRectangle(x, y, w, h, edge);
    scene->DrawRectangle(x + 4, y + 4, w - 8, h - 8, center);
}
static void neonBadge(Scene2D *scene) {
    // Original geometric helmet/skull mark; no extracted Sony/GoldHEN assets.
    border(scene, 95, 180, 520, 465, PURPLE, PANEL);
    scene->DrawRectangle(205, 240, 300, 260, CYAN);
    scene->DrawRectangle(213, 247, 284, 250, NIGHT);
    scene->DrawRectangle(244, 281, 222, 173, PURPLE);
    scene->DrawRectangle(251, 291, 208, 148, BLACK);
    scene->DrawRectangle(267, 335, 68, 23, CYAN);
    scene->DrawRectangle(375, 335, 68, 23, PURPLE);
    scene->DrawRectangle(345, 379, 18, 22, WHITE);
    for (int i = 0; i < 6; ++i)
        scene->DrawRectangle(280 + 25 * i, 415, 14, 29, WHITE);
    scene->DrawRectangle(250, 492, 210, 5, CYAN);
}
static void render(Scene2D *scene, FT_Face big, FT_Face normal, FT_Face small,
                   int selected, bool details, int frame) {
    scene->FrameBufferFill(BG);

    // Dual neon top line and the independent application's title.
    scene->DrawRectangle(34, 31, 1852, 4, CYAN);
    scene->DrawRectangle(34, 36, 1852, 3, PURPLE);
    border(scene, 37, 55, 1847, 112, CYAN, PANEL);
    label(scene, big, "BX-HEN", 95, 131, PANEL, WHITE);
    label(scene, normal, "v2.2", 510, 126, PANEL, PURPLE);
    label(scene, small, "PERSONALIZACAO: RUOK999", 1280, 121, PANEL, CYAN);

    // Left brand panel: stylized neon skull and unmistakable project credit.
    neonBadge(scene);
    border(scene, 95, 664, 520, 205, CYAN, PANEL);
    label(scene, big, "BX-HEN", 171, 758, PANEL, WHITE);
    label(scene, normal, "BY RUOK999", 180, 821, PANEL, PURPLE);
    label(scene, small, "APP NATIVO / PREVIA 0.1", 117, 930, BG, MUTED);

    // Menu items are only a navigable representation, never real toggle controls.
    border(scene, 672, 181, 1212, 750, PURPLE, PANEL);
    for (int i = 0; i < MENU_COUNT; ++i) {
        const int x = 700, y = 200 + i * 89, w = 1151, h = 78;
        const bool active = i == selected;
        const Color card = active ? NIGHT : CARD;
        if (active) {
            border(scene, x - 4, y - 4, w + 8, h + 8, PURPLE, CARD);
            border(scene, x, y, w, h, CYAN, card);
        } else {
            border(scene, x, y, w, h, {32, 79, 151}, card);
        }
        scene->DrawRectangle(x + 19, y + 23, 25, 25, active ? PURPLE : CYAN);
        label(scene, normal, MENU[i].name, x + 79, y + 55, card, WHITE);
        label(scene, normal, ">", x + 1083, y + 55, card, active ? PURPLE : MUTED);
    }

    // Read-only explanatory panel opens on Cross; none of the original HEN
    // settings can be acted on via this independent sample app.
    if (details) {
        border(scene, 680, 280, 1200, 450, CYAN, BLACK);
        label(scene, big, MENU[selected].name, 730, 380, BLACK, CYAN);
        label(scene, small, MENU[selected].info, 730, 455, BLACK, WHITE);
        label(scene, small, "Modo demonstracao. Sem alteracoes no console.", 730, 530, BLACK, PURPLE);
        label(scene, small, "O: VOLTAR", 730, 630, BLACK, MUTED);
    }

    border(scene, 38, 963, 1845, 87, CYAN, PANEL);
    label(scene, small, "CIMA/BAIXO: NAVEGAR  X: DETALHES  O: VOLTAR", 80, 1022, PANEL, WHITE);
    label(scene, small, "OPCOES: SAIR", 1120, 1022, PANEL, MUTED);
    label(scene, small, "BX-HEN v2.2 / RUOK999", 1460, 1022, PANEL, PURPLE);

    (void)frame;
}
int main() {
    setvbuf(stdout, NULL, _IONBF, 0);
    Scene2D scene(SCREEN_W, SCREEN_H, SCREEN_DEPTH);
    if (!scene.Init(0xC000000, 2)) {
        DEBUGLOG << "BX-HEN Neon: video init failed";
        return 1;
    }
    Controller pad;
    if (!pad.Init(-1)) {
        DEBUGLOG << "BX-HEN Neon: pad init failed";
        return 2;
    }
    FT_Face big, normal, small;
    const char *font = "/app0/assets/fonts/Gontserrat-Regular.ttf";
    if (!scene.InitFont(&big, font, 68) ||
        !scene.InitFont(&normal, font, 43) ||
        !scene.InitFont(&small, font, 29)) {
        DEBUGLOG << "BX-HEN Neon: font init failed";
        return 3;
    }

    DEBUGLOG << "BX-HEN Neon 0.1 UI started (read only)";
    int selected = 0;
    int frame = 0;
    int cooldown = 0;
    bool details = false;
    for (;;) {
        if (cooldown > 0) --cooldown;
        if (cooldown == 0) {
            if (pad.StartPressed()) break;
            if (pad.CirclePressed()) {
                details = false;
                cooldown = 9;
            } else if (!details && pad.DpadDownPressed()) {
                selected = (selected + 1) % MENU_COUNT;
                cooldown = 9;
            } else if (!details && pad.DpadUpPressed()) {
                selected = (selected + MENU_COUNT - 1) % MENU_COUNT;
                cooldown = 9;
            } else if (!details && pad.XPressed()) {
                details = true;
                cooldown = 9;
            }
        }

        render(&scene, big, normal, small, selected, details, frame);
        scene.SubmitFlip(frame);
        scene.FrameWait(frame);
        scene.FrameBufferSwap();
        ++frame;
    }
    DEBUGLOG << "BX-HEN Neon UI exited normally";
    return 0;
}
