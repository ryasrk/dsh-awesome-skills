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
	fieldAutoRouteHint: "Rewrite the installed skill-router when these values change"
};
const zh = {
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
	fieldAutoRouteHint: "这些值变化时重写已安装的 skill-router"
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
//#region src/client/index.tsx
/** Dictionary namespace owned by this plugin. */
const NS = "dsh-awesome-skills";
/** Required browser services (cordis fiber inject). */
const inject = [
	"locale",
	"slots",
	"settingsScope"
];
/**
* Mount the plugin's browser surfaces.
* @param ctx - the browser plugin context.
*/
function apply(ctx) {
	ctx.effect(() => ctx.locale.register(NS, {
		en,
		zh
	}), "dsh-awesome-skills: dictionaries");
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