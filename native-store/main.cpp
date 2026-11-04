#include <cstdio>
#include <cstring>
#include <sstream>
#include <orbis/libkernel.h>

#include "../../_common/graphics.h"
#include "../../_common/log.h"
#include "controller.h"

#define W 1920
#define H 1080
#define DEPTH 4

// First-stage smoke test: no PKG downloader, installer or remote endpoints.
// Only original BX-HEN branding, a local catalog and pad navigation.
std::stringstream debugLogStream;

static const char* const titles[] = {
    "Minecraft Online Manager",
    "Java Launcher BX-CT7",
    "Sobre a loja"
};
static const char* const descriptions[] = {
    "Projeto em preparacao. PKG ainda nao publicado.",
    "Projeto em preparacao. PKG ainda nao publicado.",
    "Versao inicial de teste da interface BX-HEN Store."
};
static const int COUNT = 3;

int main() {
    setvbuf(stdout, NULL, _IONBF, 0);
    Scene2D scene(W, H, DEPTH);
    if (!scene.Init(0xC000000, 2)) {
        DEBUGLOG << "BX-HEN Store: video initialization failed";
        return 1;
    }
    Controller pad;
    if (!pad.Init(-1)) {
        DEBUGLOG << "BX-HEN Store: pad initialization failed";
        return 2;
    }

    FT_Face large, small;
    const char *font = "/app0/assets/fonts/Gontserrat-Regular.ttf";
    if (!scene.InitFont(&large, font, 66) ||
        !scene.InitFont(&small, font, 36)) {
        DEBUGLOG << "BX-HEN Store: font initialization failed";
        return 3;
    }

    Color background = {7, 17, 35};
    Color panel = {16, 39, 69};
    Color selectedColor = {20, 96, 140};
    Color cyan = {95, 230, 245};
    Color white = {238, 250, 255};
    Color muted = {170, 195, 219};

    int selected = 0;
    bool details = false;
    int frame = 0;
    int cooldown = 0;

    DEBUGLOG << "BX-HEN Store 0.1 test build started";
    for (;;) {
        if (cooldown > 0) --cooldown;
        if (!cooldown) {
            if (pad.DpadDownPressed()) {
                selected = (selected + 1) % COUNT;
                details = false;
                cooldown = 9;
            } else if (pad.DpadUpPressed()) {
                selected = (selected + COUNT - 1) % COUNT;
                details = false;
                cooldown = 9;
            } else if (pad.XPressed()) {
                details = true;
                cooldown = 9;
            } else if (pad.CirclePressed()) {
                details = false;
                cooldown = 9;
            }
        }

        scene.FrameBufferFill(background);
        scene.DrawRectangle(65, 66, 1790, 133, panel);

        char brand[] = "BX-HEN STORE";
        char subtitle[] = "Versao 0.1 - TESTE DE ABERTURA / INTERFACE";
        scene.DrawText(brand, large, 102, 107, panel, cyan);
        scene.DrawText(subtitle, small, 104, 190, background, muted);

        for (int i = 0; i < COUNT; ++i) {
            Color card = i == selected ? selectedColor : panel;
            int y = 292 + (i * 154);
            scene.DrawRectangle(100, y, 1720, 128, card);
            char title[128];
            snprintf(title, sizeof(title), "%s", titles[i]);
            scene.DrawText(title, small, 138, y + 45, card, white);
            char label[] = "PENDENTE";
            if (i < 2) scene.DrawText(label, small, 1460, y + 45, card, cyan);
        }

        scene.DrawRectangle(100, 804, 1720, 185, panel);
        if (details) {
            char message[150];
            snprintf(message, sizeof(message), "%s", descriptions[selected]);
            scene.DrawText(message, small, 132, 865, panel, white);
            char warning[] = "Sem instalacao: este PKG testa apenas a interface.";
            scene.DrawText(warning, small, 132, 937, panel, cyan);
        } else {
            char help[] = "CIMA/BAIXO: navegar     X: detalhes     O: voltar";
            scene.DrawText(help, small, 132, 880, panel, white);
            char warning[] = "Sem downloads, rede ou instalador nesta versao.";
            scene.DrawText(warning, small, 132, 940, panel, muted);
        }
        scene.SubmitFlip(frame);
        scene.FrameWait(frame);
        scene.FrameBufferSwap();
        ++frame;
    }
}
