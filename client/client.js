window.__ModuleLoader__.load({ id: "dsh-awesome-skills", factory: (require, module, exports) => {
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let react = require("react");
let react_jsx_runtime = require("react/jsx-runtime");
//#region src/client/locales.ts
/**
* Locale dictionaries for the plugin's browser surfaces (settings card and
* the skills section). Namespaced under the plugin id so entries cannot
* collide with another plugin's strings.
*/
const en = {
	sectionTitle: "Skills",
	searchPlaceholder: "Search the 16,000-skill corpus…",
	searchHint: "Describe what you want to do; results come from semantic search on the host.",
	results: "{n} results",
	corpusCount: "{n} skills indexed",
	copyPath: "Copy path",
	copied: "Copied",
	noResults: "No skills matched.",
	error: "Search failed. Try again.",
	loading: "Searching…",
	cardTitle: "dsh-awesome-skills",
	cardDescription: "Semantic search over the local 16,000-skill corpus",
	fieldSemantic: "Semantic lane",
	fieldSemanticHint: "Vector similarity (wasm). Off falls back to lexical + n-gram only",
	fieldDefaultK: "Results per search",
	fieldDefaultKHint: "How many hits search() returns (1-25)",
	fieldPool: "Candidate pool",
	fieldPoolHint: "Candidates re-ranked before the top results are chosen (50-3000)",
	fieldWLex: "Lexical weight",
	fieldWLexHint: "Weight of the keyword-overlap lane (0-1)",
	fieldWGram: "N-gram weight",
	fieldWGramHint: "Weight of the character-trigram lane (0-1)",
	fieldAutoRoute: "Keep skill-router in step",
	fieldAutoRouteHint: "Rewrite the installed skill-router when these values change",
	detailSkillTitle: "Skill picked",
	detailUnknownName: "name unavailable",
	detailUnknownTool: "Unknown tool call",
	detailTool: "Tool",
	detailRunning: "Running…",
	detailDuration: "Duration",
	detailArgs: "Arguments",
	detailOutput: "Output",
	detailError: "Failed",
	detailTruncated: "(truncated)",
	unitMs: "ms",
	unitS: "s",
	unitMin: "min"
};
const zh = {
	sectionTitle: "技能",
	searchPlaceholder: "搜索 1.6 万技能语料…",
	searchHint: "描述你想做的事情；结果由宿主端的语义搜索返回。",
	results: "{n} 条结果",
	corpusCount: "已索引 {n} 个技能",
	copyPath: "复制路径",
	copied: "已复制",
	noResults: "没有匹配的技能。",
	error: "搜索失败，请重试。",
	loading: "搜索中…",
	cardTitle: "dsh-awesome-skills",
	cardDescription: "对本地 1.6 万技能语料进行语义检索",
	fieldSemantic: "语义通道",
	fieldSemanticHint: "向量相似度（wasm）。关闭后仅用词法 + n-gram",
	fieldDefaultK: "每次搜索结果数",
	fieldDefaultKHint: "search() 返回的条数（1-25）",
	fieldPool: "候选池大小",
	fieldPoolHint: "重排前的候选数量（50-3000）",
	fieldWLex: "词法权重",
	fieldWLexHint: "关键词重合通道的权重（0-1）",
	fieldWGram: "n-gram 权重",
	fieldWGramHint: "字符三元组通道的权重（0-1）",
	fieldAutoRoute: "同步 skill-router",
	fieldAutoRouteHint: "这些值变化时重写已安装的 skill-router",
	detailSkillTitle: "已选取技能",
	detailUnknownName: "名称不可用",
	detailUnknownTool: "未知工具调用",
	detailTool: "工具",
	detailRunning: "运行中…",
	detailDuration: "耗时",
	detailArgs: "参数",
	detailOutput: "输出",
	detailError: "失败",
	detailTruncated: "（已截断）",
	unitMs: "毫秒",
	unitS: "秒",
	unitMin: "分"
};
//#endregion
//#region src/client/SettingsCard.tsx
/**
* The plugin's settings card in Settings → Plugins → Plugin configuration.
*
* Follows the shared card contract: staged edits, one save, an overridden
* badge per field, and a render-nothing when the namespace is unavailable
* (a deployment without this plugin's settings section shows no trace).
*/
/** Fields the card edits, in display order. */
const FIELDS = [
	{
		key: "semantic",
		labelKey: "fieldSemantic",
		hintKey: "fieldSemanticHint",
		type: "toggle"
	},
	{
		key: "defaultK",
		labelKey: "fieldDefaultK",
		hintKey: "fieldDefaultKHint",
		type: "number"
	},
	{
		key: "pool",
		labelKey: "fieldPool",
		hintKey: "fieldPoolHint",
		type: "number"
	},
	{
		key: "wLex",
		labelKey: "fieldWLex",
		hintKey: "fieldWLexHint",
		type: "number"
	},
	{
		key: "wGram",
		labelKey: "fieldWGram",
		hintKey: "fieldWGramHint",
		type: "number"
	},
	{
		key: "autoRoute",
		labelKey: "fieldAutoRoute",
		hintKey: "fieldAutoRouteHint",
		type: "toggle"
	}
];
/**
* Render the plugin's configuration card.
* @param props - the bound settings scope.
*/
function SettingsCard(props) {
	const { scope } = props;
	const [snapshot, setSnapshot] = (0, react.useState)(() => scope.getSnapshot());
	const [drafts, setDrafts] = (0, react.useState)({});
	const [saving, setSaving] = (0, react.useState)(false);
	const [failed, setFailed] = (0, react.useState)(false);
	(0, react.useEffect)(() => scope.subscribe(() => {
		setSnapshot(scope.getSnapshot());
	}), [scope]);
	const t = (key) => {
		return en[key];
	};
	const value = snapshot.value;
	const user = snapshot.user;
	if (snapshot.status !== "ready" || value === void 0) return null;
	const field = (key) => {
		const staged = drafts[key];
		const current = value[key];
		return staged ?? {
			draft: current === void 0 ? "" : String(current),
			overridden: user?.[key] !== void 0
		};
	};
	const dirty = FIELDS.some((f) => f.key in drafts);
	const anyInvalid = FIELDS.some((f) => {
		const d = drafts[f.key]?.draft;
		if (d === void 0) return false;
		return !isValid(f.type, d);
	});
	const stage = (key, draft) => {
		setFailed(false);
		setDrafts((prev) => ({
			...prev,
			[key]: {
				draft,
				overridden: prev[key]?.overridden ?? user?.[key] !== void 0
			}
		}));
	};
	const save = async () => {
		setSaving(true);
		setFailed(false);
		try {
			for (const f of FIELDS) {
				const staged = drafts[f.key];
				if (staged === void 0) continue;
				if (!isValid(f.type, staged.draft)) continue;
				await scope.set(f.key, parse(f.type, staged.draft));
			}
			setDrafts({});
		} catch {
			setFailed(true);
		} finally {
			setSaving(false);
		}
	};
	const discard = () => {
		setDrafts({});
		setFailed(false);
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: t("cardTitle") }),
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("cardDescription") }),
		FIELDS.map((f) => {
			const state = field(f.key);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t(f.labelKey) }),
				f.type === "toggle" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: state.draft === "true",
					onChange: (e) => stage(f.key, e.target.checked ? "true" : "false")
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					type: "text",
					value: state.draft,
					onChange: (e) => stage(f.key, e.target.value)
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t(f.hintKey) }),
				state.overridden && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: "overridden" })
			] }, f.key);
		}),
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
			disabled: !dirty || anyInvalid || saving || !snapshot.writable,
			onClick: () => {
				save();
			},
			children: "Save"
		}),
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
			disabled: !dirty || saving,
			onClick: discard,
			children: "Discard"
		}),
		failed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			role: "alert",
			children: "Save failed — retry"
		})
	] });
}
function isValid(type, draft) {
	if (type === "toggle") return draft === "true" || draft === "false";
	const n = Number(draft);
	return draft !== "" && Number.isFinite(n);
}
function parse(type, draft) {
	return type === "toggle" ? draft === "true" : Number(draft);
}
//#endregion
//#region src/client/SkillExplorer.tsx
/**
* The Skill Explorer: a live semantic search box over the host's 16k corpus,
* rendered inside the plugin's own "Skills" settings section.
*
* Queries the host RPC route with a 300ms debounce and never throws — every
* failure lands in the error state. Styling is minimal/inline on purpose; a
* CSS module can come later without moving any of this logic.
*/
/** Resolve an absolute route against the page the bundle runs in (dsh-market's api() shape). */
function api(path) {
	const relative = path.replace(/^\/+/, "");
	if (typeof document === "undefined") return `/${relative}`;
	return new URL(relative, document.baseURI).pathname;
}
/**
* Run one search against the host route.
* @returns the parsed response, or an error object; never throws.
*/
async function runQuery(query, k) {
	try {
		const response = await fetch(api("/dsh-awesome-skills/query"), {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				query,
				k
			})
		});
		const body = await response.json();
		if (!response.ok || body.ok !== true) return {
			ok: false,
			error: body.ok === false && typeof body.error === "string" ? body.error : `HTTP ${response.status}`
		};
		return body;
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : String(error)
		};
	}
}
/** Ask the status route how many skills the corpus holds; 0 on any failure. */
async function fetchCount() {
	try {
		const response = await fetch(api("/dsh-awesome-skills/status"));
		if (!response.ok) return 0;
		const body = await response.json();
		return typeof body.count === "number" && Number.isFinite(body.count) ? body.count : 0;
	} catch {
		return 0;
	}
}
/** Fill a dictionary template's {n} placeholder. */
function template(text, n) {
	return text.replace("{n}", String(n));
}
/**
* Render the explorer section.
* @param props - the injected locale lookup.
*/
function SkillExplorer(props) {
	const { t } = props;
	const [query, setQuery] = (0, react.useState)("");
	const [results, setResults] = (0, react.useState)(void 0);
	const [loading, setLoading] = (0, react.useState)(false);
	const [failed, setFailed] = (0, react.useState)(false);
	const [count, setCount] = (0, react.useState)(0);
	const [copied, setCopied] = (0, react.useState)(void 0);
	const seqRef = (0, react.useRef)(0);
	const debounceRef = (0, react.useRef)(void 0);
	(0, react.useEffect)(() => {
		fetchCount().then(setCount);
		return () => clearTimeout(debounceRef.current);
	}, []);
	(0, react.useEffect)(() => {
		const trimmed = query.trim();
		clearTimeout(debounceRef.current);
		if (trimmed === "") {
			setResults(void 0);
			setLoading(false);
			setFailed(false);
			return;
		}
		setLoading(true);
		const seq = ++seqRef.current;
		debounceRef.current = setTimeout(() => {
			runQuery(trimmed, 8).then((body) => {
				if (seq !== seqRef.current) return;
				if (body.ok) {
					setResults(body.results);
					setCount(body.count);
					setFailed(false);
				} else setFailed(true);
				setLoading(false);
			});
		}, 300);
		return () => clearTimeout(debounceRef.current);
	}, [query]);
	const copyPath = (0, react.useCallback)((path) => {
		const done = () => {
			setCopied(path);
			setTimeout(() => {
				setCopied((current) => current === path ? void 0 : current);
			}, 1500);
		};
		if (typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function") {
			navigator.clipboard.writeText(path).then(done, done);
			return;
		}
		done();
	}, []);
	const list = (0, react.useMemo)(() => results ?? [], [results]);
	const inputStyle = {
		width: "100%",
		boxSizing: "border-box",
		padding: "6px 10px",
		fontSize: 13,
		borderRadius: 6,
		border: "1px solid rgba(128,128,128,0.4)",
		background: "transparent",
		color: "inherit"
	};
	const rowStyle = {
		padding: "8px 10px",
		borderRadius: 6,
		border: "1px solid rgba(128,128,128,0.25)",
		marginBottom: 6
	};
	const mutedStyle = {
		opacity: .65,
		fontSize: 12,
		margin: "4px 0 8px"
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: { padding: "4px 0" },
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				style: inputStyle,
				value: query,
				placeholder: t("searchPlaceholder"),
				onChange: (event) => setQuery(event.target.value),
				"aria-label": t("searchPlaceholder")
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: mutedStyle,
				children: t("searchHint")
			}),
			failed && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
				style: {
					color: "inherit",
					margin: "8px 0"
				},
				children: ["⚠ ", t("error")]
			}),
			loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: mutedStyle,
				children: t("loading")
			}),
			!loading && !failed && results !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
					style: mutedStyle,
					children: [template(t("results"), list.length), count > 0 && ` · ${template(t("corpusCount"), count)}`]
				}),
				list.length === 0 && query.trim() !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					style: mutedStyle,
					children: t("noResults")
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: list.map((hit) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: rowStyle,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => copyPath(hit.path),
							style: {
								all: "unset",
								cursor: "pointer",
								display: "block",
								fontWeight: 600,
								fontSize: 13,
								width: "100%"
							},
							title: t("copyPath"),
							children: [hit.name, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: {
									float: "right",
									fontWeight: 400,
									opacity: .6
								},
								children: hit.score.toFixed(3)
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								fontSize: 12,
								marginTop: 2,
								opacity: .8
							},
							children: hit.description
						}),
						copied === hit.path && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								fontSize: 12,
								marginTop: 2,
								opacity: .9
							},
							children: [
								copied,
								": ",
								hit.path
							]
						})
					]
				}, hit.path)) })
			] })
		]
	});
}
//#endregion
//#region src/client/SkillPickDetails.tsx
/** Longest rendered arguments text before truncation in the generic fallback. */
const ARGS_LIMIT = 2e3;
/** Shared monospace block styling (inline until a CSS module lands). */
const preStyle = {
	margin: "4px 0",
	padding: "6px 8px",
	fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
	fontSize: "0.85em",
	whiteSpace: "pre-wrap",
	wordBreak: "break-word"
};
/**
* Render the selected call: the skill card for `skill` picks, the generic
* fallback for every other tool, and a one-line placeholder when the block
* itself is unusable.
* @param props - call block, workspace root, and the copy seat.
* @returns the details output body.
*/
function SkillPickDetails(props) {
	const { block, t } = props;
	if (block === null || typeof block !== "object") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: t("detailUnknownTool") });
	const result = isResultBlock(block) ? block : null;
	const running = result === null && isRunningBlock(block) ? block : null;
	if (result === null && running === null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: t("detailUnknownTool") });
	const toolName = result ? result.call === null ? void 0 : result.call.name : running?.name;
	const argsRaw = result ? result.call === null ? void 0 : result.call.argsRaw : running?.argsRaw;
	const pretty = prettyJson(argsRaw);
	const duration = result === null ? void 0 : formatDuration(result, t);
	if (toolName !== "skill") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
			t("detailTool"),
			": ",
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: toolName ?? t("detailUnknownTool") })
		] }),
		result === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: t("detailRunning") }) : null,
		duration !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
			t("detailDuration"),
			": ",
			duration
		] }) : null,
		pretty !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
			style: preStyle,
			children: truncate(pretty, t("detailTruncated"))
		}) : null,
		result !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
			style: preStyle,
			"data-error": result.isError || void 0,
			children: resultText(result.content)
		}) : null,
		result !== null && result.isError ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			role: "alert",
			children: errorLine(result, t)
		}) : null
	] });
	const skillName = parseSkillName(argsRaw);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
			t("detailSkillTitle"),
			": ",
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: skillName !== void 0 ? skillName : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: t("detailUnknownName") }) })
		] }),
		result === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: t("detailRunning") }) : null,
		duration !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
			t("detailDuration"),
			": ",
			duration
		] }) : null,
		pretty !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: t("detailArgs") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
			style: preStyle,
			children: pretty
		})] }) : null,
		result !== null && result.isError ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			role: "alert",
			children: errorLine(result, t)
		}) : null,
		result !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: t("detailOutput") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
			style: preStyle,
			"data-error": result.isError || void 0,
			children: resultText(result.content)
		})] }) : null
	] });
}
/** Settled-call discriminator: only the result node carries `kind`. */
function isResultBlock(value) {
	return value.kind === "tool-result";
}
/** Running-call discriminator: its `name` and `argsRaw` are both strings. */
function isRunningBlock(value) {
	const candidate = value;
	return typeof candidate.name === "string" && typeof candidate.argsRaw === "string";
}
/**
* Extract the skill name from the call arguments, accepting both the JSON
* form the tool schema produces and a bare name.
* @param argsRaw - verbatim arguments text; may be absent or non-JSON.
* @returns the skill name, or undefined when nothing name-like is present.
*/
function parseSkillName(argsRaw) {
	if (argsRaw === void 0) return void 0;
	try {
		const parsed = JSON.parse(argsRaw);
		const name = parsed !== null && typeof parsed === "object" ? parsed.name : void 0;
		if (typeof name === "string" && name.trim() !== "") return name;
	} catch {}
	const trimmed = argsRaw.trim();
	return trimmed === "" ? void 0 : trimmed;
}
/**
* Re-render the arguments as indented JSON, or verbatim when they are not
* JSON (a parse failure must not hide the arguments).
* @param argsRaw - verbatim arguments text; may be absent.
* @returns pretty JSON, verbatim text, or undefined when there is nothing to show.
*/
function prettyJson(argsRaw) {
	if (argsRaw === void 0 || argsRaw.trim() === "") return void 0;
	try {
		return JSON.stringify(JSON.parse(argsRaw), null, 2);
	} catch {
		return argsRaw;
	}
}
/**
* Flatten the result content blocks to displayable text, mirroring the
* shipped fallback: text blocks verbatim, everything else as JSON.
* @param content - result content blocks; tolerated non-array input yields ''.
* @returns the joined text ('' when the result carries no content).
*/
function resultText(content) {
	if (!Array.isArray(content)) return "";
	const parts = [];
	for (const block of content) {
		const text = block !== null && typeof block === "object" && block.type === "text" ? block.text : void 0;
		if (typeof text === "string") {
			parts.push(text);
			continue;
		}
		try {
			parts.push(JSON.stringify(block, null, 2) ?? "");
		} catch {
			parts.push(String(block));
		}
	}
	return parts.join("\n");
}
/**
* Human-readable wall-clock duration of the settled call.
* @param result - the settled block whose call and result events are timed.
* @param t - copy seat for the unit symbols.
* @returns the formatted duration, or undefined when the call time is absent.
*/
function formatDuration(result, t) {
	if (result.callTime === null) return void 0;
	const start = Number(result.callTime);
	const end = Number(result.time);
	if (!Number.isFinite(start) || !Number.isFinite(end)) return void 0;
	const ms = Math.max(0, end - start);
	if (ms < 1e3) return `${Math.round(ms)} ${t("unitMs")}`;
	if (ms < 6e4) return `${(ms / 1e3).toFixed(1)} ${t("unitS")}`;
	return `${Math.floor(ms / 6e4)} ${t("unitMin")} ${Math.round(ms % 6e4 / 1e3)} ${t("unitS")}`;
}
/**
* Truncate overlong arguments text for the generic fallback.
* @param text - the rendered arguments.
* @param label - localized truncation marker.
* @returns the text unchanged within the limit, else the head plus the marker.
*/
function truncate(text, label) {
	return text.length <= ARGS_LIMIT ? text : `${text.slice(0, ARGS_LIMIT)}… ${label}`;
}
/**
* Error line for a failed call: badge text plus the recorded error identity.
* @param result - the settled block carrying the error.
* @param t - copy seat for the badge label.
* @returns the full error line.
*/
function errorLine(result, t) {
	const detail = result.error !== void 0 ? ` — ${result.error.name}: ${result.error.code}` : "";
	return `${t("detailError")}${detail}`;
}
//#endregion
//#region src/client/index.tsx
/** Dictionary namespace owned by this plugin. */
const NS = "dsh-awesome-skills";
/** Required browser services (cordis fiber inject). */
const inject = [
	"locale",
	"slots",
	"settingsScope"
];
/** Sidebar order for the Skills section: after the Market section (40). */
const SECTION_ORDER = 45;
/**
* Shadows the shipped details renderer: single-slot cells elect the lowest
* priority, and ui-tool occupies the default (0) cell, so this registration
* wins without clashing at that priority.
*/
const DETAILS_PRIORITY = -1;
/**
* Mount the plugin's browser surfaces.
* @param ctx - the browser plugin context.
*/
function apply(ctx) {
	ctx.effect(() => ctx.locale.register(NS, {
		en,
		zh
	}), "dsh-awesome-skills: dictionaries");
	const t = ctx.locale.bind(NS);
	ctx.slots.inject("conversation.details.tool", () => ctx.slots.register({
		name: "conversation.details.tool",
		id: "dsh-awesome-skills-skill-pick",
		priority: DETAILS_PRIORITY,
		locale: NS,
		inject: () => ({ t })
	}, (owner) => {
		const o = owner ?? {};
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillPickDetails, {
			block: o.block,
			cwd: o.cwd,
			t
		});
	}));
	ctx.inject(["slots"], (scoped) => {
		const slotsCtx = scoped;
		const t = ctx.locale.bind(NS);
		slotsCtx.slots.inject("settings.section", () => slotsCtx.slots.register({
			name: "settings.section",
			id: "skills",
			order: SECTION_ORDER,
			label: () => t("sectionTitle"),
			locale: NS,
			inject: () => ({ t })
		}, () => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillExplorer, { t })));
	});
	ctx.inject(["settingsScope"], (scoped) => {
		const scopeCtx = scoped;
		const scope = scopeCtx.settingsScope.bind({ namespace: NS });
		scopeCtx.slots.inject("settings.plugin.item", () => scopeCtx.slots.register({
			name: "settings.plugin.item",
			key: NS,
			locale: NS,
			inject: () => ({})
		}, () => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingsCard, { scope })));
	});
}
//#endregion
exports.apply = apply;
exports.inject = inject;

} });
//# sourceMappingURL=client.js.map