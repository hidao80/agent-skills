(function () {
  "use strict";

  var LANGUAGES = ["en", "ja", "zh", "es", "ru", "de"];
  var DEFAULT_LANGUAGE = "en";
  var STORAGE_KEY = "agent-skills-lang";

  // <title> and <meta name="description"> are outside language-group templates.
  var META = {
    en: {
      title: "agent-skills — Reusable Agent Skills for AI coding agents",
      description: "A collection of reusable Agent Skills (SKILL.md) for AI coding agents such as Claude Code: repository analysis, commit messages, landing pages, CI/CD modernization, security audits, and more."
    },
    ja: {
      title: "agent-skills — AI コーディングエージェントのための再利用可能な Agent Skills",
      description: "Claude Code などの AI コーディングエージェント向けの再利用可能な Agent Skills（SKILL.md）集。リポジトリ解析、コミットメッセージ、ランディングページ、CI/CD のモダナイズ、セキュリティ監査など。"
    },
    zh: {
      title: "agent-skills — 面向 AI 编码代理的可复用 Agent Skills",
      description: "面向 Claude Code 等 AI 编码代理的可复用 Agent Skills（SKILL.md）合集：仓库分析、提交信息、落地页、CI/CD 现代化、安全审计等。"
    },
    es: {
      title: "agent-skills — Agent Skills reutilizables para agentes de programación con IA",
      description: "Una colección de Agent Skills (SKILL.md) reutilizables para agentes de programación con IA como Claude Code: análisis de repositorios, mensajes de commit, landing pages, modernización de CI/CD, auditorías de seguridad y más."
    },
    ru: {
      title: "agent-skills — переиспользуемые Agent Skills для ИИ-агентов программирования",
      description: "Набор переиспользуемых Agent Skills (SKILL.md) для ИИ-агентов программирования, таких как Claude Code: анализ репозитория, сообщения коммитов, лендинги, модернизация CI/CD, аудит безопасности и многое другое."
    },
    de: {
      title: "agent-skills — Wiederverwendbare Agent Skills für KI-Coding-Agenten",
      description: "Eine Sammlung wiederverwendbarer Agent Skills (SKILL.md) für KI-Coding-Agenten wie Claude Code: Repository-Analyse, Commit-Nachrichten, Landingpages, CI/CD-Modernisierung, Sicherheitsaudits und mehr."
    }
  };

  var COPY_ICON =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var CHECK_ICON =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M20 6 9 17l-5-5"/></svg>';

  function readStoredLanguage() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function storeLanguage(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* storage unavailable: ignore */
    }
  }

  function detectLanguage() {
    var stored = readStoredLanguage();
    if (stored && LANGUAGES.indexOf(stored) !== -1) return stored;
    var browser = (navigator.language || DEFAULT_LANGUAGE).toLowerCase().split("-")[0];
    return LANGUAGES.indexOf(browser) !== -1 ? browser : DEFAULT_LANGUAGE;
  }

  function updateMeta(lang) {
    var meta = META[lang] || META[DEFAULT_LANGUAGE];
    document.title = meta.title;
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", meta.description);
    document.documentElement.setAttribute("lang", lang);
  }

  function initLanguage() {
    var select = document.getElementById("lang-select");
    var ml = typeof MultilanguageJS === "function"
      ? new MultilanguageJS({ languages: LANGUAGES, defaultLanguage: DEFAULT_LANGUAGE })
      : null;

    function apply(lang) {
      if (ml) ml.setLanguage(lang);
      updateMeta(lang);
      if (select) select.value = lang;
    }

    apply(detectLanguage());

    if (select) {
      select.addEventListener("change", function () {
        storeLanguage(select.value);
        apply(select.value);
      });
    }
  }

  function initCopyButtons() {
    var buttons = document.querySelectorAll(".code-row .copy-btn, .copy-btn[data-command]");
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.innerHTML = COPY_ICON;
      btn.addEventListener("click", function () {
        var code = btn.parentElement.querySelector("code");
        var text = btn.getAttribute("data-command") || (code && code.textContent.trim());
        if (!text || !navigator.clipboard) return;
        navigator.clipboard.writeText(text).then(function () {
          btn.innerHTML = CHECK_ICON;
          btn.classList.add("is-copied");
          setTimeout(function () {
            btn.innerHTML = COPY_ICON;
            btn.classList.remove("is-copied");
          }, 1600);
        });
      });
    });
  }

  initLanguage();
  initCopyButtons();
})();
