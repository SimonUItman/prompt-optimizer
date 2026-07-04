const storage = {
  scenes: "prompt-studio.scenes",
  templates: "prompt-studio.templates",
  history: "prompt-studio.history"
};

const moduleDefinitions = [
  {
    id: "aim",
    name: "AIM 提问法",
    description: "用 Actor / Information / Mission 固定任务边界。",
    enabled: true,
    fields: [
      ["actor", "AI 应扮演的角色", "你是一名经验丰富的学习规划顾问"],
      ["currentProblem", "当前问题", ""],
      ["shortGoal", "短期目标", ""],
      ["longGoal", "长期目标", ""],
      ["expectedOutput", "期望输出格式", "分阶段计划、每日行动、检查清单"]
    ],
    options: []
  },
  {
    id: "control",
    name: "需求控制",
    description: "控制 AI 在信息不足、需求模糊或问题复杂时的响应方式。",
    enabled: true,
    options: [
      ["understand", "需求理解模式", "回答前判断信息是否不足；不足时先问关键问题。"],
      ["oneByOne", "一次问一个", "需要澄清时一次只问一个最关键问题。"],
      ["optimizeQuestion", "需求优化模式", "先生成 2 个更精准的问题版本并说明适用场景。"],
      ["analysis", "问题分析模式", "按问题复述、信息提取、原因分析、判断依据、结论、建议输出。"]
    ]
  },
  {
    id: "truth",
    name: "真实性保证",
    description: "按需启用事实、来源、反证和不确定性标注，不能被强制开启。",
    enabled: false,
    options: [
      ["factOpinion", "区分事实 / 数据 / 观点 / 推断", "明确标注不同类型信息。"],
      ["source", "引用可靠来源", "关键结论需要说明信息来源。"],
      ["doubleVerify", "双重验证", "关键结论尽量引用 2 个独立来源。"],
      ["counter", "反证检查", "主动寻找反对观点、限制条件或例外情况。"],
      ["confidence", "可信度标注", "对重要结论标注高 / 中 / 低可信度。"],
      ["uncertainty", "不确定性说明", "说明可能过时或无法确认的信息。"]
    ]
  },
  {
    id: "output",
    name: "输出标准",
    description: "规定答案结构、可执行性、计算和决策表达方式。",
    enabled: true,
    options: [
      ["conclusionFirst", "先给结论，再展开解释", "把结论放在开头。"],
      ["clearStructure", "结构清晰", "使用清晰标题、列表或表格。"],
      ["noVague", "不要泛泛而谈", "避免空泛建议。"],
      ["actionable", "建议可执行", "每个建议都包含下一步动作。"],
      ["formula", "计算给公式", "涉及计算时给出公式和关键假设。"],
      ["defineFirst", "复杂概念先定义", "先严谨定义，再通俗解释。"],
      ["decision", "决策说明取舍", "说明推荐理由、取舍逻辑和适用条件。"],
      ["summaryNext", "总结和下一步", "结尾给总结和下一步行动。"]
    ]
  },
  {
    id: "iteration",
    name: "迭代修正",
    description: "要求 AI 在输出前做有限自检，并给出优化后版本。",
    enabled: false,
    options: [
      ["logic", "检查逻辑漏洞", "检查推理链是否断裂。"],
      ["missing", "检查信息不足", "指出缺失的关键输入。"],
      ["clarity", "检查表达不清", "优化含糊表述。"],
      ["execution", "检查可执行性", "确认建议能落地。"],
      ["unverified", "检查未经验证判断", "标出未经验证的判断。"],
      ["finalVersion", "输出最终版", "给出优化后的最终版本。"],
      ["showSummary", "展示自检摘要", "在答案末尾展示简短自检摘要。"]
    ]
  }
];

const optionPromptText = {
  aim: {
    header: "请严格遵循 AIM 框架：",
    actor: "Actor：你需要扮演「{value}」。",
    info: "Information：结合用户背景、目标和限制条件理解任务。",
    mission: "Mission：围绕用户当前需求完成任务，并按期望格式输出。"
  },
  control: {
    understand: "回答前先判断信息是否不足；若不足，先提出关键澄清问题。",
    oneByOne: "如果需要澄清，一次只问一个最关键的问题。",
    optimizeQuestion: "正式回答前，先给出 2 个更精准的问题版本，并说明各自适用场景。",
    analysis: "适合排查或分析时，按「问题复述 -> 关键信息 -> 可能原因 -> 判断依据 -> 最终结论 -> 可执行建议」输出。"
  },
  truth: {
    factOpinion: "区分事实、数据、观点和推断，不混淆表达。",
    source: "关键结论需要说明可靠来源。",
    doubleVerify: "每个关键结论尽量使用 2 个独立来源交叉验证。",
    counter: "主动寻找反对观点、限制条件或例外情况。",
    confidence: "对重要结论标注高 / 中 / 低可信度。",
    uncertainty: "说明哪些信息可能过时、无法确认或依赖假设。"
  },
  output: {
    conclusionFirst: "先给结论，再展开解释。",
    clearStructure: "内容结构清晰，优先使用标题、列表或表格。",
    noVague: "不要泛泛而谈，避免空洞建议。",
    actionable: "每个建议都要可执行，写清下一步动作。",
    formula: "涉及计算时给出公式、变量含义和关键假设。",
    defineFirst: "涉及复杂概念时，先严谨定义，再通俗解释。",
    decision: "涉及决策时，说明推荐理由、取舍逻辑和适用条件。",
    summaryNext: "最后给出总结和下一步行动。"
  },
  iteration: {
    logic: "输出前检查逻辑漏洞。",
    missing: "输出前检查信息不足。",
    clarity: "输出前检查表达不清。",
    execution: "输出前检查可执行性。",
    unverified: "输出前检查未经验证的判断。",
    finalVersion: "完成自检后输出优化后的最终版本。",
    showSummary: "如有必要，在末尾展示简短自检摘要。"
  }
};

function createInitialModules() {
  return moduleDefinitions.map((module) => ({
    ...module,
    values: Object.fromEntries((module.fields || []).map(([id, , value]) => [id, value])),
    selected: Object.fromEntries((module.options || []).map(([id]) => [id, module.enabled && id !== "oneByOne"]))
  }));
}

const defaultScenes = [
  {
    id: "study",
    name: "学习计划",
    builtIn: true,
    request: {
      userInput: "我想系统学习 AI Agent",
      background: "有基础编程经验，但缺少系统路线",
      goal: "一个月内完成入门，并做出一个可演示的小项目",
      constraints: "每天可投入 1-2 小时，优先实践，不追求一次学完所有理论"
    },
    moduleConfig: {
      aim: {
        enabled: true,
        values: {
          actor: "你是一名 AI Agent 学习教练和项目导师",
          currentProblem: "用户想学习 AI Agent，但不知道如何拆解学习路径和实践项目",
          shortGoal: "制定 4 周学习计划，明确每天/每周要做什么",
          longGoal: "形成能持续迭代的 AI Agent 学习路线，并完成一个小型 Agent 项目",
          expectedOutput: "学习路线表、每周任务、每日行动、项目选题、检查清单"
        }
      },
      control: { enabled: true, selected: { understand: true, oneByOne: true, optimizeQuestion: false, analysis: false } },
      truth: { enabled: false },
      output: { enabled: true },
      iteration: { enabled: false }
    }
  },
  {
    id: "research",
    name: "行业分析",
    builtIn: true,
    request: {
      userInput: "帮我做一个行业分析",
      background: "用于快速理解一个行业的市场结构、关键玩家和机会点",
      goal: "输出可用于决策的行业分析框架",
      constraints: "需要区分事实和推断，避免空泛结论"
    },
    moduleConfig: {
      aim: {
        enabled: true,
        values: {
          actor: "你是一名资深行业研究员和商业分析顾问",
          currentProblem: "用户需要快速理解目标行业，但缺少结构化分析框架",
          shortGoal: "梳理行业规模、产业链、竞争格局、趋势和风险",
          longGoal: "帮助用户判断行业机会、进入策略和后续调研方向",
          expectedOutput: "行业概览、产业链地图、关键玩家、趋势判断、机会风险、下一步调研清单"
        }
      },
      control: { enabled: true, selected: { understand: true, oneByOne: false, optimizeQuestion: false, analysis: true } },
      truth: {
        enabled: true,
        selected: { factOpinion: true, source: true, doubleVerify: true, counter: true, confidence: true, uncertainty: true }
      },
      output: { enabled: true },
      iteration: { enabled: true }
    }
  },
  {
    id: "debug",
    name: "代码排查",
    builtIn: true,
    request: {
      userInput: "帮我排查一段代码的问题",
      background: "我会提供代码、报错信息和运行环境",
      goal: "定位问题原因并给出可执行修复方案",
      constraints: "先不要大改架构，优先找最小修复路径"
    },
    moduleConfig: {
      aim: {
        enabled: true,
        values: {
          actor: "你是一名资深全栈工程师和代码审查专家",
          currentProblem: "用户遇到代码运行错误或行为异常，需要定位原因",
          shortGoal: "根据代码、报错和上下文找到最可能的问题点",
          longGoal: "形成稳定修复方案，并说明如何验证问题已解决",
          expectedOutput: "问题复述、可能原因排序、定位步骤、修复代码、验证方法"
        }
      },
      control: { enabled: true, selected: { understand: true, oneByOne: true, optimizeQuestion: false, analysis: true } },
      truth: { enabled: false },
      output: { enabled: true },
      iteration: { enabled: true, selected: { logic: true, missing: true, clarity: true, execution: true, unverified: false, finalVersion: true, showSummary: false } }
    }
  }
];

const state = {
  activeModule: "aim",
  request: {
    userInput: "",
    background: "",
    goal: "",
    constraints: ""
  },
  modules: createInitialModules(),
  settings: {
    model: "deepseek-chat",
    baseUrl: "https://api.deepseek.com",
    temperature: 0.4,
    maxTokens: 2400
  },
  aimSuggestions: [],
  aimSuggesting: false,
  expandedFields: {},
  finalPrompt: ""
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function getModule(id) {
  return state.modules.find((module) => module.id === id);
}

function persist(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadList(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function getSavedScenes() {
  const scenes = loadList(storage.scenes);
  const oldTemplates = loadList(storage.templates).map((item) => ({
    id: item.id,
    name: item.name || "旧模板",
    request: item.request || { userInput: item.name || "", background: "", goal: "", constraints: "" },
    modules: item.modules || createInitialModules(),
    activeModule: item.activeModule || "aim",
    finalPrompt: item.finalPrompt || "",
    createdAt: item.createdAt || new Date().toISOString()
  }));
  return [...scenes, ...oldTemplates.filter((oldItem) => !scenes.some((scene) => scene.id === oldItem.id))];
}

function getAllScenes() {
  return [...defaultScenes.map(sceneToSnapshot), ...getSavedScenes()];
}

function sceneToSnapshot(scene) {
  const modules = createInitialModules();
  Object.entries(scene.moduleConfig || {}).forEach(([moduleId, config]) => {
    const module = modules.find((item) => item.id === moduleId);
    if (!module) return;
    if (typeof config.enabled === "boolean") module.enabled = config.enabled;
    if (config.values) module.values = { ...module.values, ...config.values };
    if (config.selected) module.selected = { ...module.selected, ...config.selected };
  });
  return {
    id: scene.id,
    name: scene.name,
    builtIn: scene.builtIn,
    request: structuredClone(scene.request),
    modules,
    activeModule: "aim",
    finalPrompt: "",
    createdAt: scene.createdAt || new Date().toISOString()
  };
}

function captureCurrentScene(name) {
  return {
    id: crypto.randomUUID(),
    name,
    request: structuredClone(state.request),
    modules: structuredClone(state.modules),
    activeModule: state.activeModule,
    finalPrompt: state.finalPrompt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function applySceneSnapshot(scene) {
  state.request = structuredClone(scene.request || { userInput: "", background: "", goal: "", constraints: "" });
  state.modules = structuredClone(scene.modules || createInitialModules());
  state.activeModule = scene.activeModule || state.modules.find((module) => module.enabled)?.id || "aim";
  state.finalPrompt = scene.finalPrompt || "";
  state.aimSuggestions = [];
  $("#final-prompt").value = state.finalPrompt;
  showView("compose");
  render();
  setStatus(`已套用常用场景：${scene.name}`);
}

function saveCurrentScene() {
  const defaultName = state.request.userInput || "未命名场景";
  const name = window.prompt("给这个常用场景起个名字：", defaultName);
  if (!name?.trim()) return;
  const scenes = getSavedScenes().filter((scene) => !scene.builtIn);
  scenes.unshift(captureCurrentScene(name.trim()));
  persist(storage.scenes, scenes.slice(0, 60));
  localStorage.removeItem(storage.templates);
  renderScenes();
  setStatus("已保存为常用场景，包含需求、背景、目标、限制、模块和所有子配置。");
}

function deleteSavedScene(id) {
  persist(
    storage.scenes,
    loadList(storage.scenes).filter((item) => item.id !== id)
  );
  persist(
    storage.templates,
    loadList(storage.templates).filter((item) => item.id !== id)
  );
  renderScenes();
  setStatus("已删除自定义常用场景。");
}

function renameSavedScene(id) {
  const scenes = getSavedScenes().filter((scene) => !scene.builtIn);
  const scene = scenes.find((item) => item.id === id);
  if (!scene) return;

  const name = window.prompt("新的常用场景名称：", scene.name);
  if (!name?.trim()) return;

  scene.name = name.trim();
  scene.updatedAt = new Date().toISOString();
  persist(storage.scenes, scenes);
  localStorage.removeItem(storage.templates);
  renderScenes();
  setStatus("已重命名常用场景。");
}

function renderModules() {
  $("#module-list").innerHTML = state.modules
    .map(
      (module) => `
        <button class="module-item ${state.activeModule === module.id ? "active" : ""}" data-module="${module.id}">
          <span class="switch ${module.enabled ? "on" : ""}" role="presentation"></span>
          <span>
            <strong>${module.name}</strong>
            <small>${module.description}</small>
          </span>
        </button>
      `
    )
    .join("");

  $$(".module-item").forEach((button) => {
    button.addEventListener("click", (event) => {
      const module = getModule(button.dataset.module);
      if (event.target.classList.contains("switch")) {
        module.enabled = !module.enabled;
      }
      state.activeModule = module.id;
      render();
    });
  });
}

function renderActiveModule() {
  const module = getModule(state.activeModule);
  $("#active-module-title").textContent = module.name;
  $("#active-module-desc").textContent = module.description;
  $("#active-module-status").textContent = module.enabled ? "已启用" : "未启用";
  $("#active-module-status").classList.toggle("off", !module.enabled);

  const aiActions =
    module.id === "aim"
      ? `
        <div class="ai-fill-bar">
          <button class="secondary" id="suggest-aim-btn" ${state.aimSuggesting ? "disabled" : ""}>
            ${state.aimSuggesting ? "生成中..." : "AI 一键补齐 AIM"}
          </button>
          <small>根据当前需求生成 3 套角色、问题、目标和输出格式，套用后仍可手动修改。</small>
        </div>
      `
      : "";

  $("#module-fields").innerHTML = (module.fields || [])
    .map(
      ([id, label]) => {
        const expanded = Boolean(state.expandedFields[`${module.id}:${id}`]);
        const value = escapeHtml(module.values[id] || "");
        return `
          <div class="field-row ${expanded ? "expanded" : ""}">
            <div class="field-label">
              <span>${label}</span>
              <button type="button" class="field-toggle" data-toggle-field="${id}">
                ${expanded ? "收起" : "展开"}
              </button>
            </div>
            ${
              expanded
                ? `<textarea class="field-control" data-field="${id}" rows="5" ${module.enabled ? "" : "disabled"}>${value}</textarea>`
                : `<input class="field-control" data-field="${id}" value="${value}" ${module.enabled ? "" : "disabled"} />`
            }
          </div>
        `;
      }
    )
    .join("") + aiActions + renderAimSuggestions(module);

  $("#sub-option-list").innerHTML = (module.options || [])
    .map(
      ([id, name, description]) => `
        <label class="option-row ${module.enabled ? "" : "disabled"}">
          <input type="checkbox" data-option="${id}" ${module.selected[id] ? "checked" : ""} ${module.enabled ? "" : "disabled"} />
          <span>
            <strong>${name}</strong>
            <small>${description}</small>
          </span>
        </label>
      `
    )
    .join("");

  $$("#module-fields [data-field]").forEach((input) => {
    input.addEventListener("input", () => {
      module.values[input.dataset.field] = input.value;
      updatePreview();
    });
  });

  $$("[data-toggle-field]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = `${module.id}:${button.dataset.toggleField}`;
      state.expandedFields[key] = !state.expandedFields[key];
      renderActiveModule();
    });
  });

  $$("#sub-option-list input").forEach((input) => {
    input.addEventListener("change", () => {
      module.selected[input.dataset.option] = input.checked;
      updatePreview();
    });
  });

  $("#suggest-aim-btn")?.addEventListener("click", suggestAim);
  $$("[data-apply-aim]").forEach((button) => {
    button.addEventListener("click", () => applyAimSuggestion(Number(button.dataset.applyAim)));
  });
}

function renderAimSuggestions(module) {
  if (module.id !== "aim" || !state.aimSuggestions.length) return "";
  return `
    <div class="suggestion-grid">
      ${state.aimSuggestions
        .map(
          (item, index) => `
            <article class="suggestion-card">
              <div>
                <strong>${escapeHtml(item.title || `方案 ${index + 1}`)}</strong>
                <small>${escapeHtml(item.actor || "")}</small>
              </div>
              <dl>
                <dt>当前问题</dt><dd>${escapeHtml(item.currentProblem || "")}</dd>
                <dt>短期目标</dt><dd>${escapeHtml(item.shortGoal || "")}</dd>
                <dt>长期目标</dt><dd>${escapeHtml(item.longGoal || "")}</dd>
                <dt>输出格式</dt><dd>${escapeHtml(item.expectedOutput || "")}</dd>
              </dl>
              <button class="primary" data-apply-aim="${index}">套用这个方案</button>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function isSoftwareBuildRequest(text) {
  return /做(一个|款)?(软件|应用|app|APP|系统|网站|网页|工具|小程序|平台)|开发(一个|款)?(软件|应用|app|APP|系统|网站|网页|工具|小程序|平台)|设计(一个|款)?(软件|应用|app|APP|系统|网站|网页|工具|小程序|平台)/i.test(
    text || ""
  );
}

function buildPrompt() {
  const sections = [];
  const fidelityRules = [
    "请根据以下配置生成一个给 AI 使用的提示词。不要直接回答用户需求本身。",
    "最高优先级原则：原始需求优先。",
    "必须保留用户原始需求中的任务类型、任务对象、交付物、领域边界和真实意图。",
    "AIM、需求控制、输出标准等模块只能增强原始需求，不能替换、扩写、脑补或转移原始需求。"
  ];
  sections.push(`# 提示词目标\n${fidelityRules.join("\n")}`);
  const requestLines = [
    `原始需求：${state.request.userInput || "（待填写）"}`,
    state.request.background ? `用户背景：${state.request.background}` : "",
    state.request.goal ? `目标：${state.request.goal}` : "",
    state.request.constraints ? `限制条件：${state.request.constraints}` : ""
  ].filter(Boolean);

  sections.push(`# 任务输入\n${requestLines.join("\n")}`);

  for (const module of state.modules) {
    if (!module.enabled) continue;
    if (module.id === "aim") {
      const values = module.values;
      sections.push(
        [
          "# AIM 提问法",
          values.actor ? optionPromptText.aim.actor.replace("{value}", values.actor) : "",
          optionPromptText.aim.info,
          values.currentProblem ? `当前问题：${values.currentProblem}` : "",
          values.shortGoal ? `短期目标：${values.shortGoal}` : "",
          values.longGoal ? `长期目标：${values.longGoal}` : "",
          values.expectedOutput ? `期望输出格式：${values.expectedOutput}` : "",
          optionPromptText.aim.mission
        ]
          .filter(Boolean)
          .join("\n")
      );
      continue;
    }

    const selected = Object.entries(module.selected)
      .filter(([, enabled]) => enabled)
      .map(([id]) => optionPromptText[module.id][id]);
    if (!selected.length) continue;
    sections.push(`# ${module.name}\n${selected.map((text) => `- ${text}`).join("\n")}`);
  }

  sections.push("# 输出要求\n请只遵循以上已启用模块，不要添加未出现的真实性验证、双重来源、反证检查或自检要求。");
  return sections.join("\n\n");
}

function updatePreview() {
  $("#draft-preview").value = buildPrompt();
}

function renderRequestBindings() {
  [
    ["#user-input", "userInput"],
    ["#background-input", "background"],
    ["#goal-input", "goal"],
    ["#constraints-input", "constraints"]
  ].forEach(([selector, key]) => {
    const input = $(selector);
    input.value = state.request[key];
    input.oninput = () => {
      state.request[key] = input.value;
      updatePreview();
    };
  });
}

function renderScenes() {
  const scenes = getAllScenes();
  $("#quick-scene-list").innerHTML = scenes
    .map(
      (scene) => `
        <button data-load-scene="${scene.id}">
          <span>${escapeHtml(scene.name)}</span>
          ${scene.builtIn ? "" : `<small>自定义</small>`}
        </button>
      `
    )
    .join("");

  $("#template-list").innerHTML = scenes.length
    ? scenes
        .map(
          (item) => `
            <article class="list-card">
              <div>
                <strong>${escapeHtml(item.name)}</strong>
                <small>${item.builtIn ? "内置场景" : new Date(item.createdAt).toLocaleString()}</small>
                <small>${escapeHtml(item.request?.userInput || "")}</small>
              </div>
              <div class="inline-actions">
                <button data-load-scene="${item.id}">套用</button>
                ${item.builtIn ? "" : `<button data-rename-scene="${item.id}">重命名</button>`}
                ${item.builtIn ? "" : `<button data-delete-scene="${item.id}">删除</button>`}
              </div>
            </article>
          `
        )
        .join("")
    : `<p class="empty">还没有常用场景。可以在生成页保存当前完整配置。</p>`;

  $$("[data-load-scene]").forEach((button) => {
    button.addEventListener("click", () => {
      const scene = getAllScenes().find((item) => item.id === button.dataset.loadScene);
      if (scene) applySceneSnapshot(scene);
    });
  });

  $$("[data-delete-scene]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteSavedScene(button.dataset.deleteScene);
    });
  });

  $$("[data-rename-scene]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      renameSavedScene(button.dataset.renameScene);
    });
  });
}

function renderHistory() {
  const keyword = $("#history-search")?.value?.trim() || "";
  const history = loadList(storage.history).filter((item) => {
    const haystack = `${item.title} ${item.prompt}`.toLowerCase();
    return haystack.includes(keyword.toLowerCase());
  });
  $("#history-list").innerHTML = history.length
    ? history
        .map(
          (item) => `
            <article class="history-card">
              <div>
                <strong>${item.title}</strong>
                <small>${new Date(item.createdAt).toLocaleString()}</small>
              </div>
              <pre>${escapeHtml(item.prompt.slice(0, 420))}${item.prompt.length > 420 ? "..." : ""}</pre>
              <div class="inline-actions">
                <button data-copy-history="${item.id}">复制</button>
                <button data-load-history="${item.id}">编辑</button>
                <button data-delete-history="${item.id}">删除</button>
              </div>
            </article>
          `
        )
        .join("")
    : `<p class="empty">暂无历史记录。</p>`;

  $$("[data-copy-history]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = loadList(storage.history).find((entry) => entry.id === button.dataset.copyHistory);
      if (item) copyText(item.prompt);
    });
  });
  $$("[data-load-history]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = loadList(storage.history).find((entry) => entry.id === button.dataset.loadHistory);
      if (!item) return;
      state.finalPrompt = item.prompt;
      $("#final-prompt").value = item.prompt;
      showView("compose");
    });
  });
  $$("[data-delete-history]").forEach((button) => {
    button.addEventListener("click", () => {
      persist(
        storage.history,
        loadList(storage.history).filter((entry) => entry.id !== button.dataset.deleteHistory)
      );
      renderHistory();
    });
  });
}

function bindActions() {
  $$(".nav-tab").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  $("#copy-draft-btn").addEventListener("click", () => copyText($("#draft-preview").value));
  $("#copy-final-btn").addEventListener("click", () => copyText($("#final-prompt").value));
  $("#export-md-btn").addEventListener("click", () => downloadFile("optimized-prompt.md", $("#final-prompt").value || $("#draft-preview").value));
  $("#export-txt-btn").addEventListener("click", () => downloadFile("optimized-prompt.txt", $("#final-prompt").value || $("#draft-preview").value));
  $("#final-prompt").addEventListener("input", (event) => (state.finalPrompt = event.target.value));
  $("#history-search").addEventListener("input", renderHistory);

  $("#save-scene-btn").addEventListener("click", saveCurrentScene);
  $("#save-scene-page-btn").addEventListener("click", saveCurrentScene);
  $("#save-scene-sidebar-btn").addEventListener("click", saveCurrentScene);

  $("#optimize-btn").addEventListener("click", optimize);

  [
    ["#model-input", "model"],
    ["#base-url-input", "baseUrl"],
    ["#temperature-input", "temperature"],
    ["#max-tokens-input", "maxTokens"]
  ].forEach(([selector, key]) => {
    $(selector).addEventListener("input", (event) => {
      state.settings[key] = event.target.type === "number" ? Number(event.target.value) : event.target.value;
    });
  });
}

function cleanPromptForUse(content) {
  let text = String(content || "").trim();
  text = text
    .replace(/^好的[，,。\s\S]*?以下是(?:优化后的)?\s*Prompt[：:]\s*/i, "")
    .replace(/^遵照[，,。\s\S]*?以下是(?:优化后的)?\s*Prompt[：:]\s*/i, "")
    .replace(/^以下是(?:优化后的)?\s*Prompt[：:]\s*/i, "")
    .replace(/^这是(?:优化后的)?\s*Prompt[：:]\s*/i, "")
    .trim();
  const markerIndex = text.search(/(?:^|\n)\s*(?:---\s*)?\n?\s*(#{1,3}\s+|\*\*[^*\n]+[：:])/);
  if (markerIndex > 0) text = text.slice(markerIndex).trim();
  return text.replace(/^---+\s*/, "").replace(/\s*---+\s*$/g, "").trim();
}

async function optimize() {
  const draftPrompt = $("#draft-preview").value.trim();
  if (!state.request.userInput.trim()) {
    setStatus("请先填写一句话需求。", true);
    return;
  }
  setStatus("正在调用后端优化 Prompt...");
  $("#optimize-btn").disabled = true;
  try {
    const response = await fetch("/api/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftPrompt, settings: state.settings })
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.message);
    const cleanedPrompt = cleanPromptForUse(data.optimizedPrompt);
    state.finalPrompt = cleanedPrompt;
    $("#final-prompt").value = cleanedPrompt;
    saveHistory(cleanedPrompt);
    setStatus("优化完成，已保存到历史记录。");
  } catch (error) {
    const fallback = `${draftPrompt}\n\n# 优化提示\nDeepSeek 暂不可用：${error.message}`;
    $("#final-prompt").value = fallback;
    setStatus(error.message, true);
  } finally {
    $("#optimize-btn").disabled = false;
    renderHistory();
  }
}

async function suggestAim() {
  if (!state.request.userInput.trim()) {
    setStatus("请先填写一句话需求，AI 才知道要补齐什么。", true);
    return;
  }

  state.activeModule = "aim";
  state.aimSuggesting = true;
  setStatus("正在生成 AIM 补齐方案...");
  renderActiveModule();

  try {
    const response = await fetch("/api/suggest-aim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request: state.request,
        requestType: isSoftwareBuildRequest(state.request.userInput) ? "software_build" : "general",
        settings: state.settings
      })
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.message);
    state.aimSuggestions = data.suggestions || [];
    setStatus("已生成 3 套 AIM 方案，可以选择一个套用后继续修改。");
  } catch (error) {
    setStatus(error.message || "AIM 补齐失败。", true);
  } finally {
    state.aimSuggesting = false;
    renderActiveModule();
    updatePreview();
  }
}

function applyAimSuggestion(index) {
  const suggestion = state.aimSuggestions[index];
  const module = getModule("aim");
  if (!suggestion || !module) return;

  module.enabled = true;
  module.values.actor = suggestion.actor || module.values.actor || "";
  module.values.currentProblem = suggestion.currentProblem || "";
  module.values.shortGoal = suggestion.shortGoal || "";
  module.values.longGoal = suggestion.longGoal || "";
  module.values.expectedOutput = suggestion.expectedOutput || "";

  state.activeModule = "aim";
  render();
  setStatus("已套用 AIM 方案，你可以继续手动微调。");
}

function saveHistory(prompt) {
  const history = loadList(storage.history);
  history.unshift({
    id: crypto.randomUUID(),
    title: state.request.userInput.slice(0, 36) || "未命名 Prompt",
    prompt,
    createdAt: new Date().toISOString()
  });
  persist(storage.history, history.slice(0, 80));
}

function showView(view) {
  $$(".nav-tab").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  $$(".main-view").forEach((panel) => panel.classList.remove("active"));
  $(`#${view}-view`).classList.add("active");
}

function copyText(text) {
  if (!text.trim()) {
    setStatus("没有可复制的内容。", true);
    return;
  }
  navigator.clipboard.writeText(text);
  setStatus("已复制。");
}

function downloadFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function setStatus(message, isError = false) {
  const node = $("#status-message");
  node.textContent = message;
  node.classList.toggle("error", isError);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function render() {
  renderRequestBindings();
  renderModules();
  renderActiveModule();
  updatePreview();
  renderScenes();
  renderHistory();
}

bindActions();
render();
