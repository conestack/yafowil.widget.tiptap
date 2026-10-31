Changes
=======

2.0.2 (unreleased)
------------------

- Nothing changed yet.


2.0.1 (2026-10-31)
------------------

- Fix ``destroy`` of the default widget leaving the help link, the button
  tooltips and the dropdowns in the DOM. Tooltips and dropdowns were appended
  to ``body`` and never removed.
  [rnix]

- Fix spellchecking not being disabled in the bootstrap5 editor. With jQuery 4
  ``.attr('spellcheck', false)`` removes the attribute instead of setting
  ``spellcheck="false"``.
  [rnix]

- Fix the bootstrap5 widget with ``helpLink`` failing to construct with a
  ``TypeError``, which also left all following editors uninitialized. The help
  link tooltip works now, and ``destroy`` disposes the tooltip and removes the
  help link.
  [rnix]

- Upgrade tiptap to 3.32, ``@tiptap/core`` before 3.30.4 is vulnerable
  (``mergeAttributes()`` turns an own ``__proto__`` key into DOM attributes).
  Switching from HTML source back to the editor now syncs the textarea with the
  normalised editor HTML.
  [rnix]

- Drop the unused ``@rollup/plugin-typescript``, ``rollup-plugin-ts``,
  ``rollup-plugin-typescript2``, ``rollup-plugin-export-default``, ``tslib``,
  ``@tiptap/starter-kit`` and ``@tiptap/extension-code-block-lowlight``
  dependencies, declare ``@rollup/plugin-node-resolve``. Add ``bootstrap`` as
  dev dependency for testing the bootstrap5 widget.
  [rnix]

- Do not write a byte order mark into the compiled CSS.
  [rnix]

- Extend the JS tests to 100 % coverage, all modules including bundles are
  loaded by the tests now.
  [rnix]

- Lint and format the JS code with biome. ``make check`` runs ``biome check``,
  ``make format`` runs ``biome check --write`` (see ``include.mk``). Behavior
  unchanged.
  [rnix]

- JS tooling: Commit ``pnpm-lock.yaml``. Upgrade ``@web/test-runner`` to 1.0
  and run the JS tests headless in Chromium via Playwright, installed in the JS
  CI workflow. Drop the accidental ``install`` dev dependency. Pin patched
  versions of vulnerable transitive dependencies via ``pnpm.overrides``.
  [rnix]

- Modernise the code ruff flags as outdated: ``u''`` prefixes. Behaviour
  unchanged. ``super(Class, self)`` is kept, see ``cone.app``.
  [rnix]

- Sort the imports with ruff (one per line, ``from`` imports first, no
  sections) and format the code with ``ruff format`` (90 characters per line,
  single quotes).
  [rnix]

- Add ``qa.ruff`` domain to Makefile and pin the ruff configuration in
  ``pyproject.toml``, ``make check`` runs ``ruff check``.
  [rnix]

- Drop the Python 2 remnants: ``yafowil.compat`` usage, ``IS_PY2`` branches and
  ``# -*- coding: utf-8 -*-``.
  [rnix]

- Declare ``requires-python = ">=3.10"``.
  [rnix]


2.0.0 (2026-02-03)
------------------

- Refactor package layout to use ``pyproject.toml`` and implicit namespace packages.
  [rnix]

- Introduce ``display_class`` widget property.
  [lenadax]

- Update jQuery to version ``4.0.0-beta.2``.
  [lenadax]

- Use rollup for bundling scss. Use ``make rollup`` to compile js and scss.
  [lenadax]

- Use ``webtestrunner`` instead of ``karma`` for js tests. Use ``make wtr`` to run tests.
  [lenadax]

- Use ``pnpm`` as package manager.
  [lenadax]

- Create Bootstrap5 widget version.
  [lenadax]

- Extend JS by ``tiptap_on_array_add`` and ``register_array_subscribers``
  functions to enable usage in ``yafowil.widget.array``.
  [lenadax]

- Make it work.
  [lenadax]
