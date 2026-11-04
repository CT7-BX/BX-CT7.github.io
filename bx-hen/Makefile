CC ?= cc
CFLAGS ?= -std=c11 -Wall -Wextra -Werror -pedantic -O2
INCLUDES = -Iinclude
SOURCES = src/bx_firmware.c src/bx_diagnostics.c
BINDIR = build
.PHONY: all test clean

all: $(BINDIR)/bx-hen-diag

$(BINDIR):
	mkdir -p $(BINDIR)

$(BINDIR)/bx-hen-diag: $(SOURCES) src/main.c include/bx_firmware.h include/bx_diagnostics.h | $(BINDIR)
	$(CC) $(CFLAGS) $(INCLUDES) $(SOURCES) src/main.c -o $@

$(BINDIR)/test-diagnostics: $(SOURCES) tests/test_diagnostics.c include/bx_firmware.h include/bx_diagnostics.h | $(BINDIR)
	$(CC) $(CFLAGS) $(INCLUDES) $(SOURCES) tests/test_diagnostics.c -o $@

test: $(BINDIR)/test-diagnostics
	./$(BINDIR)/test-diagnostics

clean:
	rm -rf $(BINDIR)
