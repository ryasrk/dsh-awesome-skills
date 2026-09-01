window.__ModuleLoader__.load({ id: "dsh-awesome-skills", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let react = require("react");
let react_jsx_runtime = require("react/jsx-runtime");
//#region \0dsh-css:SectionTabs_module_css.mjs
const css$3 = ".jsPfLW_tabs{border-bottom:1px solid var(--dsw-alias-border-l2);align-items:flex-end;gap:2px;margin-bottom:16px;display:flex}.jsPfLW_tab{-webkit-appearance:none;appearance:none;font:inherit;white-space:nowrap;cursor:pointer;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-bottom:2px solid #0000;margin-bottom:-1px;padding:7px 12px;font-size:13px;line-height:1.5}.jsPfLW_tab:hover{color:var(--dsw-alias-label-primary)}.jsPfLW_tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px;border-radius:4px}.jsPfLW_tabOn{color:var(--dsw-alias-brand-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:600;}.jsPfLW_dot{background:var(--dsw-alias-brand-primary);vertical-align:2px;border-radius:999px;width:6px;height:6px;margin-left:6px;display:inline-block}";
const tagId$3 = "dsh-awesome-skills/SectionTabs_module_css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-awesome-skills";
	tag.dataset.pluginCss = tagId$3;
	tag.textContent = css$3;
	document.head.appendChild(tag);
}
var _dsh_css_SectionTabs_module_css_default = {
	"tab": "jsPfLW_tab",
	"dot": "jsPfLW_dot",
	"tabs": "jsPfLW_tabs",
	"tabOn": "jsPfLW_tabOn"
};
//#endregion
//#region \0dsh-css:SkillExplorer_module_css.mjs
const css$2 = ".vc1x0a_section{flex-direction:column;gap:16px;max-width:720px;padding:4px 0 16px;display:flex}.vc1x0a_search{box-sizing:border-box;width:100%;height:38px;font:inherit;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);border-radius:10px;padding:0 14px;font-size:14px;line-height:1.5}.vc1x0a_search::placeholder{color:var(--dsw-alias-label-tertiary)}.vc1x0a_search:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}.vc1x0a_searchRow{align-items:center;display:flex;position:relative}.vc1x0a_clear{-webkit-appearance:none;appearance:none;background:var(--dsw-alias-bg-module-platform);width:24px;height:24px;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border:none;border-radius:999px;font-size:14px;line-height:1;position:absolute;right:8px}.vc1x0a_clear:hover{color:var(--dsw-alias-label-primary)}.vc1x0a_clear:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.vc1x0a_search{padding-right:38px}.vc1x0a_filterBar{flex-wrap:wrap;gap:6px;display:flex}.vc1x0a_filterBtn{-webkit-appearance:none;appearance:none;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:999px;padding:3px 12px;font-size:12px;line-height:1.5}.vc1x0a_filterBtn:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}.vc1x0a_filterBtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.vc1x0a_filterOn{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:600;}.vc1x0a_rowActions{flex-wrap:wrap;align-items:center;gap:6px;margin-top:6px;display:flex}.vc1x0a_chip{-webkit-appearance:none;appearance:none;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:7px;padding:3px 10px;font-size:11px;font-weight:500;line-height:1.4;transition:background .15s,color .15s,border-color .15s}.vc1x0a_chip:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}.vc1x0a_chip:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.vc1x0a_chipPrimary{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);font-weight:600;}.vc1x0a_chipPrimary:hover{background:var(--dsw-alias-button-primary-hover)}.vc1x0a_chipOn{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-style:dashed;}.vc1x0a_hint{color:var(--dsw-alias-label-tertiary);margin:-10px 0 0;font-size:12px;line-height:1.5}.vc1x0a_results{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;display:flex}.vc1x0a_result{animation:.18s cubic-bezier(.16,1,.3,1) both vc1x0a_resultIn}@keyframes vc1x0a_resultIn{0%{opacity:0;transform:translateY(2px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.vc1x0a_result{animation:none}}.vc1x0a_result{border-bottom:1px solid var(--dsw-alias-border-l2);padding:10px 2px}.vc1x0a_result:last-child{border-bottom:none}.vc1x0a_resultHead{align-items:baseline;gap:10px;display:flex}.vc1x0a_name{-webkit-appearance:none;appearance:none;font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;text-align:left;text-overflow:ellipsis;white-space:nowrap;background:0 0;border:0;flex:1;min-width:0;padding:0;font-size:14px;font-weight:600;line-height:1.4;overflow:hidden}.vc1x0a_name:hover{text-decoration:underline}.vc1x0a_name:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;border-radius:4px}.vc1x0a_pin{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);white-space:nowrap;border-radius:4px;margin-left:6px;padding:0 5px;font-size:10px;font-weight:600;line-height:15px}.vc1x0a_score{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary);flex:none;font-size:12px}.vc1x0a_description{color:var(--dsw-alias-label-secondary);margin:2px 0 0;font-size:12px;line-height:1.5}.vc1x0a_path{font-family:var(--dsw-alias-font-mono,ui-monospace, monospace);color:var(--dsw-alias-label-tertiary);word-break:break-all;margin:4px 0 0;font-size:11px;line-height:1.5}.vc1x0a_meta{color:var(--dsw-alias-label-tertiary);margin:0 0 8px;font-size:12px;line-height:1.5}.vc1x0a_empty{text-align:center;border:1px dashed var(--dsw-alias-border-l2);border-radius:10px;flex-direction:column;gap:4px;padding:28px 16px;display:flex}.vc1x0a_emptyTitle{color:var(--dsw-alias-label-primary);margin:0;font-size:13px;font-weight:600;line-height:1.5}.vc1x0a_emptyBody{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}.vc1x0a_state{color:var(--dsw-alias-label-tertiary);margin:8px 0 0;font-size:12px;line-height:1.5}.vc1x0a_error{color:var(--dsw-alias-label-error);margin:8px 0 0;font-size:12px;line-height:1.5}.vc1x0a_divider{border:none;border-top:1px solid var(--dsw-alias-border-l2);margin:0}.vc1x0a_configHeading{color:var(--dsw-alias-label-primary);margin:0 0 8px;font-size:13px;font-weight:600;line-height:1.5}";
const tagId$2 = "dsh-awesome-skills/SkillExplorer_module_css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-awesome-skills";
	tag.dataset.pluginCss = tagId$2;
	tag.textContent = css$2;
	document.head.appendChild(tag);
}
var _dsh_css_SkillExplorer_module_css_default = {
	"emptyTitle": "vc1x0a_emptyTitle",
	"filterBtn": "vc1x0a_filterBtn",
	"hint": "vc1x0a_hint",
	"score": "vc1x0a_score",
	"empty": "vc1x0a_empty",
	"error": "vc1x0a_error",
	"searchRow": "vc1x0a_searchRow",
	"divider": "vc1x0a_divider",
	"clear": "vc1x0a_clear",
	"search": "vc1x0a_search",
	"filterOn": "vc1x0a_filterOn",
	"chip": "vc1x0a_chip",
	"description": "vc1x0a_description",
	"configHeading": "vc1x0a_configHeading",
	"section": "vc1x0a_section",
	"resultHead": "vc1x0a_resultHead",
	"name": "vc1x0a_name",
	"chipPrimary": "vc1x0a_chipPrimary",
	"results": "vc1x0a_results",
	"rowActions": "vc1x0a_rowActions",
	"result": "vc1x0a_result",
	"pin": "vc1x0a_pin",
	"path": "vc1x0a_path",
	"filterBar": "vc1x0a_filterBar",
	"state": "vc1x0a_state",
	"emptyBody": "vc1x0a_emptyBody",
	"resultIn": "vc1x0a_resultIn",
	"meta": "vc1x0a_meta",
	"chipOn": "vc1x0a_chipOn"
};
//#endregion
//#region src/client/icons.tsx
const base = (size) => ({
	width: size,
	height: size,
	viewBox: "0 0 16 16",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 1.5,
	strokeLinecap: "round",
	strokeLinejoin: "round",
	"aria-hidden": true
});
function IconChevronUp({ size = 14 }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
		...base(size),
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 10l4-4 4 4" })
	});
}
function IconChevronDown({ size = 14 }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
		...base(size),
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 6l4 4 4-4" })
	});
}
function IconClose({ size = 12 }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
		...base(size),
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 4l8 8M12 4l-8 8" })
	});
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
function api$1(path) {
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
		const response = await fetch(api$1("/dsh-awesome-skills/query"), {
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
		const response = await fetch(api$1("/dsh-awesome-skills/status"));
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
	const { t, onHits, onAssign, onUnassign } = props;
	const membership = props.membership === void 0 ? void 0 : {
		prio: Array.isArray(props.membership.prio) ? props.membership.prio : [],
		blacklist: Array.isArray(props.membership.blacklist) ? props.membership.blacklist : [],
		whitelist: Array.isArray(props.membership.whitelist) ? props.membership.whitelist : []
	};
	const [query, setQuery] = (0, react.useState)("");
	const [results, setResults] = (0, react.useState)(void 0);
	const [loading, setLoading] = (0, react.useState)(false);
	const [failed, setFailed] = (0, react.useState)(false);
	const [count, setCount] = (0, react.useState)(0);
	const [copied, setCopied] = (0, react.useState)(void 0);
	/** Which membership slice the results show; 'all' is the unfiltered view. */
	const [filter, setFilter] = (0, react.useState)("all");
	const seqRef = (0, react.useRef)(0);
	const debounceRef = (0, react.useRef)(void 0);
	const inputRef = (0, react.useRef)(void 0);
	(0, react.useEffect)(() => {
		fetchCount().then(setCount);
		inputRef.current?.focus();
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
					onHits?.(body.results.map((r) => ({
						path: r.path,
						name: r.name
					})));
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
	const list = (0, react.useMemo)(() => {
		const hits = results ?? [];
		if (filter === "all" || membership === void 0) return hits;
		const set = new Set(membership[filter]);
		return hits.filter((h) => set.has(h.path));
	}, [
		results,
		filter,
		membership
	]);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: _dsh_css_SkillExplorer_module_css_default.section,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: _dsh_css_SkillExplorer_module_css_default.searchRow,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					ref: inputRef,
					className: _dsh_css_SkillExplorer_module_css_default.search,
					value: query,
					placeholder: t("searchPlaceholder"),
					onChange: (event) => setQuery(event.target.value),
					onKeyDown: (event) => {
						if (event.key === "Escape") setQuery("");
					},
					"aria-label": t("searchPlaceholder")
				}), query !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: _dsh_css_SkillExplorer_module_css_default.clear,
					onClick: () => setQuery(""),
					"aria-label": t("clear"),
					children: "×"
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: _dsh_css_SkillExplorer_module_css_default.hint,
				children: t("searchHint")
			}),
			membership !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: _dsh_css_SkillExplorer_module_css_default.filterBar,
				role: "group",
				"aria-label": t("scopeLabel"),
				children: [
					"all",
					"prio",
					"blacklist",
					"whitelist"
				].map((key) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: filter === key ? _dsh_css_SkillExplorer_module_css_default.filterOn : _dsh_css_SkillExplorer_module_css_default.filterBtn,
					onClick: () => setFilter(key),
					children: t(key === "all" ? "filterAll" : key === "prio" ? "filterPrio" : key === "blacklist" ? "filterBlack" : "filterWhite")
				}, key))
			}),
			failed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: _dsh_css_SkillExplorer_module_css_default.error,
				role: "alert",
				children: t("error")
			}),
			loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: _dsh_css_SkillExplorer_module_css_default.state,
				children: t("loading")
			}),
			!loading && !failed && results !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
					className: _dsh_css_SkillExplorer_module_css_default.meta,
					children: [template(t("results"), list.length), count > 0 && ` · ${template(t("corpusCount"), count)}`]
				}),
				list.length === 0 && query.trim() !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: _dsh_css_SkillExplorer_module_css_default.empty,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: _dsh_css_SkillExplorer_module_css_default.emptyTitle,
						children: t("noResultsTitle")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: _dsh_css_SkillExplorer_module_css_default.emptyBody,
						children: t("noResults")
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: _dsh_css_SkillExplorer_module_css_default.results,
					children: list.map((hit) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: _dsh_css_SkillExplorer_module_css_default.result,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: _dsh_css_SkillExplorer_module_css_default.resultHead,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: _dsh_css_SkillExplorer_module_css_default.name,
									onClick: () => copyPath(hit.path),
									title: t("copyPath"),
									children: hit.name
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: _dsh_css_SkillExplorer_module_css_default.score,
									children: hit.score.toFixed(3)
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: _dsh_css_SkillExplorer_module_css_default.description,
								children: hit.description
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: _dsh_css_SkillExplorer_module_css_default.rowActions,
								children: [membership !== void 0 && onAssign !== void 0 && onUnassign !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: [
									"prio",
									"blacklist",
									"whitelist"
								].map((key) => {
									return membership[key].includes(hit.path) ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: _dsh_css_SkillExplorer_module_css_default.chipOn,
										onClick: () => onUnassign(key, hit.path),
										title: t("remove"),
										children: [t(key === "prio" ? "chipPrio" : key === "blacklist" ? "chipBlack" : "chipWhite"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconClose, { size: 10 })]
									}, key) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: key === "prio" ? _dsh_css_SkillExplorer_module_css_default.chipPrimary : _dsh_css_SkillExplorer_module_css_default.chip,
										onClick: () => onAssign(key, hit.path),
										title: t(key === "prio" ? "addPrio" : key === "blacklist" ? "blacklistTitle" : "whitelistTitle"),
										children: t(key === "prio" ? "addPrio" : key === "blacklist" ? "addBlack" : "addWhite")
									}, key);
								}) }) : null, copied === hit.path && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: _dsh_css_SkillExplorer_module_css_default.path,
									children: hit.path
								})]
							})
						]
					}, hit.path))
				})
			] })
		]
	});
}
//#endregion
//#region \0dsh-css:SettingsCard_module_css.mjs
const css$1 = ".alOFIW_card{background:var(--dsw-alias-bg-layer-3);border-radius:12px;overflow:hidden}.alOFIW_header{border-bottom:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:4px;padding:16px 16px 14px;display:flex}.alOFIW_name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}.alOFIW_description{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5}.alOFIW_body{padding:4px 16px 16px}.alOFIW_field{flex-direction:column;gap:6px;padding:12px 0;display:flex}.alOFIW_field+.alOFIW_field{border-top:1px solid var(--dsw-alias-border-l2)}.alOFIW_head{align-items:center;gap:8px;min-height:20px;display:flex}.alOFIW_label{min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;line-height:1.5}.alOFIW_badge{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.alOFIW_revert{font:inherit;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;padding:0;font-size:12px;line-height:1.5}.alOFIW_revert:hover{color:var(--dsw-alias-label-primary)}.alOFIW_revert:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.alOFIW_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}.alOFIW_control{align-items:center;gap:8px;max-width:260px;display:flex}.alOFIW_input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);box-sizing:border-box;border-radius:8px;width:100%;min-width:0;padding:0 12px;font-size:13px;line-height:1.5}.alOFIW_input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}.alOFIW_inputInvalid{border-color:var(--dsw-alias-label-error);}.alOFIW_input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}.alOFIW_invalid{color:var(--dsw-alias-label-error);margin:0;font-size:12px;line-height:1.5}.alOFIW_toggle{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);cursor:pointer;-webkit-appearance:none;appearance:none;border-radius:999px;flex:none;width:36px;height:20px;margin:0;padding:0;transition:background .16s,border-color .16s;position:relative}.alOFIW_toggle:after{content:\"\";background:var(--dsw-alias-label-tertiary);border-radius:999px;width:14px;height:14px;transition:transform .16s,background .16s;position:absolute;top:2px;left:2px}.alOFIW_toggle:checked{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}.alOFIW_toggle:checked:after{background:var(--dsw-alias-label-primary-foreground);transform:translate(16px)}.alOFIW_toggle:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.alOFIW_toggle:disabled{cursor:default;opacity:.55}.alOFIW_segmented{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:8px;gap:2px;padding:2px;display:inline-flex}.alOFIW_seg{font:inherit;color:var(--dsw-alias-label-secondary);cursor:pointer;border:none;border-radius:6px;align-items:center;gap:6px;padding:4px 12px;font-size:12px;line-height:1.5;display:inline-flex}.alOFIW_seg input{accent-color:var(--dsw-alias-brand-primary);margin:0}.alOFIW_seg:hover{color:var(--dsw-alias-label-primary)}.alOFIW_segOn{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:600;}.alOFIW_seg:focus-within{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.alOFIW_actions{border-top:1px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;margin-top:2px;padding-top:14px;display:flex}.alOFIW_spacer{flex:1}.alOFIW_button{-webkit-appearance:none;appearance:none;border:1px solid var(--dsw-alias-border-l2);height:32px;font:inherit;cursor:pointer;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 14px;font-size:13px;font-weight:500;line-height:1;transition:border-color .16s,background .16s}.alOFIW_button:hover:not(:disabled){border-color:var(--dsw-alias-label-dimmed)}.alOFIW_button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.alOFIW_button:disabled{opacity:.5;cursor:default}.alOFIW_primary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border-color:#0000;}.alOFIW_primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}.alOFIW_alert{color:var(--dsw-alias-label-error);margin:0;font-size:12px;line-height:1.5}.alOFIW_saved{color:var(--dsw-alias-label-success,var(--dsw-alias-label-secondary));margin:0;font-size:12px;line-height:1.5}.alOFIW_footer{align-items:center;gap:8px;padding:0 16px 14px;display:flex}@media (max-width:420px){.alOFIW_control{max-width:none}}";
const tagId$1 = "dsh-awesome-skills/SettingsCard_module_css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-awesome-skills";
	tag.dataset.pluginCss = tagId$1;
	tag.textContent = css$1;
	document.head.appendChild(tag);
}
var _dsh_css_SettingsCard_module_css_default = {
	"segmented": "alOFIW_segmented",
	"toggle": "alOFIW_toggle",
	"card": "alOFIW_card",
	"description": "alOFIW_description",
	"revert": "alOFIW_revert",
	"saved": "alOFIW_saved",
	"header": "alOFIW_header",
	"footer": "alOFIW_footer",
	"spacer": "alOFIW_spacer",
	"name": "alOFIW_name",
	"actions": "alOFIW_actions",
	"control": "alOFIW_control",
	"head": "alOFIW_head",
	"seg": "alOFIW_seg",
	"primary": "alOFIW_primary",
	"field": "alOFIW_field",
	"hint": "alOFIW_hint",
	"inputInvalid": "alOFIW_inputInvalid",
	"segOn": "alOFIW_segOn",
	"input": "alOFIW_input",
	"button": "alOFIW_button",
	"alert": "alOFIW_alert",
	"badge": "alOFIW_badge",
	"invalid": "alOFIW_invalid",
	"label": "alOFIW_label",
	"body": "alOFIW_body"
};
//#endregion
//#region src/client/SettingsCard.tsx
/**
* The plugin's settings card in Settings → Plugins → Plugin configuration.
*
* Layout follows the harness's own plugin-card and field conventions (see
* SettingsCard.module.css): a title band, a stack of label-over-control rows
* separated by hairlines, then an action band — three visual bands, so the
* six fields scan instead of reading as a wall of boxes. Numeric fields are
* bounded inputs so an out-of-range value is unrepresentable rather than
* something a save has to reject; booleans are switches.
*/
/** Field descriptor: key, copy keys, control kind, and numeric bounds. */
const FIELDS = [
	{
		key: "semantic",
		label: "fieldSemantic",
		hint: "fieldSemanticHint",
		kind: "toggle"
	},
	{
		key: "defaultK",
		label: "fieldDefaultK",
		hint: "fieldDefaultKHint",
		kind: "number",
		min: 1,
		max: 25,
		step: 1
	},
	{
		key: "pool",
		label: "fieldPool",
		hint: "fieldPoolHint",
		kind: "number",
		min: 50,
		max: 3e3,
		step: 50
	},
	{
		key: "wLex",
		label: "fieldWLex",
		hint: "fieldWLexHint",
		kind: "number",
		min: 0,
		max: 1,
		step: .05
	},
	{
		key: "wGram",
		label: "fieldWGram",
		hint: "fieldWGramHint",
		kind: "number",
		min: 0,
		max: 1,
		step: .05
	},
	{
		key: "autoRoute",
		label: "fieldAutoRoute",
		hint: "fieldAutoRouteHint",
		kind: "toggle"
	},
	{
		key: "whitelistOnly",
		label: "scopeLabel",
		hint: "scopeHint",
		kind: "scope"
	}
];
/** Localized copy. zh mirrors en key-for-key so a missing key is a typo, not a gap. */
const DICT = {
	en: {
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
		save: "Save",
		discard: "Discard",
		saved: "Saved",
		failed: "Save failed — retry",
		overridden: "overridden",
		revert: "revert"
	},
	zh: {
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
		save: "保存",
		discard: "放弃",
		saved: "已保存",
		failed: "保存失败 — 重试",
		overridden: "已覆盖",
		revert: "还原"
	}
};
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
	const [savedTick, setSavedTick] = (0, react.useState)(false);
	(0, react.useEffect)(() => scope.subscribe(() => {
		setSnapshot(scope.getSnapshot());
	}), [scope]);
	const dict = (typeof document !== "undefined" ? document.documentElement.lang : "en").startsWith("zh") ? DICT.zh : DICT.en;
	const t = (key) => dict[key];
	const value = snapshot.value;
	const user = snapshot.user ?? {};
	if (snapshot.status !== "ready" || value === void 0 || typeof value !== "object") return null;
	const stateOf = (key) => {
		const staged = drafts[key];
		if (staged !== void 0) return staged;
		const current = value[key];
		return {
			draft: current === void 0 ? "" : String(current),
			overridden: user?.[key] !== void 0
		};
	};
	const dirty = FIELDS.some((f) => drafts[f.key] !== void 0);
	const invalid = FIELDS.some((f) => {
		if (f.kind !== "number") return false;
		const d = drafts[f.key]?.draft;
		return d !== void 0 && !validNumber(d, f.min, f.max);
	});
	const stage = (key, draft, wasOverridden) => {
		setFailed(false);
		setSavedTick(false);
		setDrafts((prev) => ({
			...prev,
			[key]: {
				draft,
				overridden: wasOverridden
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
				if (f.kind === "toggle" || f.kind === "scope") {
					const next = staged.draft === "true";
					if (next === value[f.key]) continue;
					await scope.set(f.key, next);
				} else {
					if (!validNumber(staged.draft, f.min, f.max)) continue;
					const n = Number(staged.draft);
					if (n === value[f.key]) continue;
					await scope.set(f.key, n);
				}
			}
			setDrafts({});
			setSavedTick(true);
		} catch {
			setFailed(true);
		} finally {
			setSaving(false);
		}
	};
	const discard = () => {
		setDrafts({});
		setFailed(false);
		setSavedTick(false);
	};
	const revert = (key) => {
		setDrafts((prev) => {
			const next = { ...prev };
			delete next[key];
			return next;
		});
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: _dsh_css_SettingsCard_module_css_default.card,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: _dsh_css_SettingsCard_module_css_default.header,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: _dsh_css_SettingsCard_module_css_default.name,
					children: t("cardTitle")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: _dsh_css_SettingsCard_module_css_default.description,
					children: t("cardDescription")
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: _dsh_css_SettingsCard_module_css_default.body,
				children: FIELDS.map((f) => {
					const state = stateOf(f.key);
					const isInvalid = f.kind === "number" && drafts[f.key] !== void 0 && !validNumber(state.draft, f.min, f.max);
					const id = `dshas-${f.key}`;
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: _dsh_css_SettingsCard_module_css_default.field,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: _dsh_css_SettingsCard_module_css_default.head,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: _dsh_css_SettingsCard_module_css_default.label,
										htmlFor: id,
										children: t(f.label)
									}),
									state.overridden && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: _dsh_css_SettingsCard_module_css_default.badge,
										children: t("overridden")
									}),
									drafts[f.key] !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: _dsh_css_SettingsCard_module_css_default.revert,
										onClick: () => revert(f.key),
										children: t("revert")
									})
								]
							}),
							f.kind === "scope" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: _dsh_css_SettingsCard_module_css_default.segmented,
								role: "radiogroup",
								"aria-label": t("scopeLabel"),
								children: [{
									value: "false",
									label: t("scopeAll")
								}, {
									value: "true",
									label: t("scopeWhitelist")
								}].map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: state.draft === option.value ? _dsh_css_SettingsCard_module_css_default.segOn : _dsh_css_SettingsCard_module_css_default.seg,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "radio",
										name: `dshas-${f.key}`,
										checked: state.draft === option.value,
										disabled: !snapshot.writable || saving,
										onChange: () => stage(f.key, option.value, state.overridden)
									}), option.label]
								}, option.value))
							}) : f.kind === "toggle" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								id,
								type: "checkbox",
								className: _dsh_css_SettingsCard_module_css_default.toggle,
								role: "switch",
								disabled: !snapshot.writable || saving,
								checked: state.draft === "true",
								onChange: (e) => stage(f.key, e.target.checked ? "true" : "false", state.overridden)
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: _dsh_css_SettingsCard_module_css_default.control,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									id,
									type: "number",
									className: isInvalid ? _dsh_css_SettingsCard_module_css_default.inputInvalid : _dsh_css_SettingsCard_module_css_default.input,
									disabled: !snapshot.writable || saving,
									min: f.min,
									max: f.max,
									step: f.step,
									value: state.draft,
									"aria-invalid": isInvalid || void 0,
									onChange: (e) => stage(f.key, e.target.value, state.overridden)
								})
							}),
							isInvalid ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: _dsh_css_SettingsCard_module_css_default.invalid,
								children: `${t(f.label)}: ${f.min} – ${f.max}`
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: _dsh_css_SettingsCard_module_css_default.hint,
								children: t(f.hint)
							})
						]
					}, f.key);
				})
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: _dsh_css_SettingsCard_module_css_default.actions,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: _dsh_css_SettingsCard_module_css_default.primary,
						disabled: !dirty || invalid || saving || !snapshot.writable,
						onClick: () => {
							save();
						},
						children: saving ? "…" : t("save")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: _dsh_css_SettingsCard_module_css_default.button,
						disabled: !dirty || saving,
						onClick: discard,
						children: t("discard")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: _dsh_css_SettingsCard_module_css_default.spacer }),
					failed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: _dsh_css_SettingsCard_module_css_default.alert,
						role: "alert",
						children: t("failed")
					}),
					!failed && savedTick && !dirty && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: _dsh_css_SettingsCard_module_css_default.saved,
						children: t("saved")
					})
				]
			})
		]
	});
}
/** A number is valid when it parses, is finite, and sits inside its bounds. */
function validNumber(draft, min, max) {
	if (draft.trim() === "") return false;
	const n = Number(draft);
	return Number.isFinite(n) && n >= min && n <= max;
}
//#endregion
//#region \0dsh-css:PrioritySkills_module_css.mjs
const css = ".bm5jra_root{flex-direction:column;gap:20px;display:flex}.bm5jra_block{flex-direction:column;gap:8px;display:flex}.bm5jra_block+.bm5jra_block{border-top:1px solid var(--dsw-alias-border-l2);margin-top:24px;padding-top:20px}.bm5jra_heading{color:var(--dsw-alias-label-primary);margin:0;font-size:13px;font-weight:600;line-height:1.5}.bm5jra_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}.bm5jra_empty{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;font-style:italic;line-height:1.5}.bm5jra_list{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;flex-direction:column;margin:0;padding:0;list-style:none;display:flex;overflow:hidden}.bm5jra_row{background:var(--dsw-alias-bg-layer-3);align-items:center;gap:8px;padding:8px 10px;display:flex}.bm5jra_row+.bm5jra_row{border-top:1px solid var(--dsw-alias-border-l2)}.bm5jra_rank{background:var(--dsw-alias-bg-module-platform);min-width:18px;height:18px;color:var(--dsw-alias-label-secondary);border-radius:9px;flex:none;justify-content:center;align-items:center;font-size:11px;font-weight:600;display:inline-flex}.bm5jra_path{min-width:0;font-family:var(--dsw-alias-font-mono,ui-monospace, monospace);color:var(--dsw-alias-label-primary);overflow-wrap:anywhere;flex:1;font-size:12px;line-height:1.5}.bm5jra_controls{flex:none;gap:4px;display:inline-flex}.bm5jra_ctl{-webkit-appearance:none;appearance:none;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary);width:24px;height:24px;font:inherit;cursor:pointer;border-radius:6px;padding:0;font-size:13px;line-height:1}.bm5jra_ctl:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}.bm5jra_ctl:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.bm5jra_ctl:disabled{opacity:.4;cursor:default}.bm5jra_pickers{flex-wrap:wrap;gap:8px;display:flex}.bm5jra_picker{max-width:320px;height:32px;font:inherit;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:8px;align-self:flex-start;padding:0 10px;font-size:12px}.bm5jra_picker:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.bm5jra_addRow{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.bm5jra_input{min-width:220px;height:32px;font:inherit;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);box-sizing:border-box;border-radius:8px;flex:1;padding:0 12px;font-size:13px}.bm5jra_input::placeholder{color:var(--dsw-alias-label-tertiary)}.bm5jra_input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}.bm5jra_primary{-webkit-appearance:none;appearance:none;border:1px solid var(--dsw-alias-brand-primary);height:32px;font:inherit;background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);cursor:pointer;border-radius:8px;padding:0 14px;font-size:13px;font-weight:500}.bm5jra_primary:disabled{opacity:.5;cursor:default}.bm5jra_button{-webkit-appearance:none;appearance:none;border:1px solid var(--dsw-alias-border-l2);height:32px;font:inherit;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:8px;padding:0 14px;font-size:13px;font-weight:500}.bm5jra_button:disabled{opacity:.5;cursor:default}.bm5jra_modeRow{flex-wrap:wrap;gap:8px;display:flex}.bm5jra_mode{font:inherit;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary);cursor:pointer;border-radius:8px;align-items:center;gap:7px;padding:6px 12px;font-size:12px;line-height:1.5;display:inline-flex}.bm5jra_mode:hover{border-color:var(--dsw-alias-label-dimmed)}.bm5jra_modeOn{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:600;}.bm5jra_mode input{accent-color:var(--dsw-alias-brand-primary);margin:0}.bm5jra_mode:focus-within{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.bm5jra_actions{border-top:1px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding-top:14px;display:flex}.bm5jra_grow{flex:1}.bm5jra_state{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.5}";
const tagId = "dsh-awesome-skills/PrioritySkills_module_css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-awesome-skills";
	tag.dataset.pluginCss = tagId;
	tag.textContent = css;
	document.head.appendChild(tag);
}
var _dsh_css_PrioritySkills_module_css_default = {
	"mode": "bm5jra_mode",
	"list": "bm5jra_list",
	"path": "bm5jra_path",
	"controls": "bm5jra_controls",
	"rank": "bm5jra_rank",
	"hint": "bm5jra_hint",
	"pickers": "bm5jra_pickers",
	"row": "bm5jra_row",
	"primary": "bm5jra_primary",
	"modeRow": "bm5jra_modeRow",
	"ctl": "bm5jra_ctl",
	"modeOn": "bm5jra_modeOn",
	"picker": "bm5jra_picker",
	"button": "bm5jra_button",
	"empty": "bm5jra_empty",
	"root": "bm5jra_root",
	"input": "bm5jra_input",
	"grow": "bm5jra_grow",
	"state": "bm5jra_state",
	"actions": "bm5jra_actions",
	"addRow": "bm5jra_addRow",
	"block": "bm5jra_block",
	"heading": "bm5jra_heading"
};
//#endregion
//#region src/client/PrioritySkills.tsx
/**
* Priority skills: the boost and mute lists, edited as ordered lists.
*
* Boost order is meaningful — the top of the list climbs highest — so the
* editor is a vertical list with explicit move controls rather than a
* checkbox grid. Mute is a flat exclusion list. Both are edited as staged
* drafts and committed through the priority route, which is the same source
* the search service reads.
*/
/**
* Render the priority editor.
* @param props - locale, staged state, change handler, picker suggestions.
*/
function PrioritySkills(props) {
	const { t, onChange, suggestions, onApply, applied } = props;
	const state = {
		prio: Array.isArray(props.state?.prio) ? props.state.prio : [],
		blacklist: Array.isArray(props.state?.blacklist) ? props.state.blacklist : [],
		whitelist: Array.isArray(props.state?.whitelist) ? props.state.whitelist : []
	};
	const [draft, setDraft] = (0, react.useState)("");
	const [saving, setSaving] = (0, react.useState)(false);
	const isDirty = applied !== void 0 && [
		"prio",
		"blacklist",
		"whitelist"
	].some((key) => {
		const a = Array.isArray(applied[key]) ? applied[key] : [];
		const b = state[key];
		return a.length !== b.length || a.some((p, i) => b[i] !== p);
	});
	const move = (0, react.useCallback)((list, from, delta) => {
		const to = from + delta;
		if (to < 0 || to >= list.length) return list;
		const next = [...list];
		const [item] = next.splice(from, 1);
		next.splice(to, 0, item);
		return next;
	}, []);
	const removeFrom = (key, index) => {
		const next = state[key].filter((_, i) => i !== index);
		onChange({
			...state,
			[key]: next
		});
	};
	const add = (key, path) => {
		const value = path.trim();
		if (value === "") return;
		if (state.prio.includes(value) || state.blacklist.includes(value) || state.whitelist.includes(value)) return;
		onChange({
			...state,
			[key]: [...state[key], value]
		});
		setDraft("");
	};
	const available = suggestions.filter((s) => !state.prio.includes(s.path) && !state.blacklist.includes(s.path) && !state.whitelist.includes(s.path));
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: _dsh_css_PrioritySkills_module_css_default.root,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: _dsh_css_PrioritySkills_module_css_default.block,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
						className: _dsh_css_PrioritySkills_module_css_default.heading,
						children: t("prioTitle")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: _dsh_css_PrioritySkills_module_css_default.hint,
						children: t("prioHint")
					}),
					state.prio.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: _dsh_css_PrioritySkills_module_css_default.empty,
						children: t("prioEmpty")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ol", {
						className: _dsh_css_PrioritySkills_module_css_default.list,
						children: state.prio.map((path, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
							className: _dsh_css_PrioritySkills_module_css_default.row,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: _dsh_css_PrioritySkills_module_css_default.rank,
									children: index + 1
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
									className: _dsh_css_PrioritySkills_module_css_default.path,
									children: path
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: _dsh_css_PrioritySkills_module_css_default.controls,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: _dsh_css_PrioritySkills_module_css_default.ctl,
											disabled: index === 0,
											onClick: () => onChange({
												...state,
												prio: move(state.prio, index, -1)
											}),
											"aria-label": t("moveUp"),
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconChevronUp, {})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: _dsh_css_PrioritySkills_module_css_default.ctl,
											disabled: index === state.prio.length - 1,
											onClick: () => onChange({
												...state,
												prio: move(state.prio, index, 1)
											}),
											"aria-label": t("moveDown"),
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconChevronDown, {})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: _dsh_css_PrioritySkills_module_css_default.ctl,
											onClick: () => removeFrom("prio", index),
											"aria-label": t("remove"),
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconClose, {})
										})
									]
								})
							]
						}, path))
					}),
					available.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: _dsh_css_PrioritySkills_module_css_default.pickers,
						children: [
							"prio",
							"blacklist",
							"whitelist"
						].map((key) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
							className: _dsh_css_PrioritySkills_module_css_default.picker,
							value: "",
							onChange: (e) => add(key, e.target.value),
							"aria-label": t(key === "prio" ? "addPrio" : key === "blacklist" ? "blacklistTitle" : "whitelistTitle"),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: "",
								children: t(key === "prio" ? "addPrio" : key === "blacklist" ? "blacklistTitle" : "whitelistTitle")
							}), available.map((s) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: s.path,
								children: s.name
							}, s.path))]
						}, key))
					})
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: _dsh_css_PrioritySkills_module_css_default.block,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
						className: _dsh_css_PrioritySkills_module_css_default.heading,
						children: t("blacklistTitle")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: _dsh_css_PrioritySkills_module_css_default.hint,
						children: t("blacklistHint")
					}),
					state.blacklist.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: _dsh_css_PrioritySkills_module_css_default.empty,
						children: t("blacklistEmpty")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: _dsh_css_PrioritySkills_module_css_default.list,
						children: state.blacklist.map((path, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
							className: _dsh_css_PrioritySkills_module_css_default.row,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
								className: _dsh_css_PrioritySkills_module_css_default.path,
								children: path
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: _dsh_css_PrioritySkills_module_css_default.controls,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: _dsh_css_PrioritySkills_module_css_default.ctl,
									onClick: () => removeFrom("blacklist", index),
									"aria-label": t("remove"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconClose, {})
								})
							})]
						}, path))
					})
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: _dsh_css_PrioritySkills_module_css_default.block,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
						className: _dsh_css_PrioritySkills_module_css_default.heading,
						children: t("whitelistTitle")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: _dsh_css_PrioritySkills_module_css_default.hint,
						children: t("whitelistHint")
					}),
					state.whitelist.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: _dsh_css_PrioritySkills_module_css_default.empty,
						children: t("whitelistEmpty")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: _dsh_css_PrioritySkills_module_css_default.list,
						children: state.whitelist.map((path, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
							className: _dsh_css_PrioritySkills_module_css_default.row,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
								className: _dsh_css_PrioritySkills_module_css_default.path,
								children: path
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: _dsh_css_PrioritySkills_module_css_default.controls,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: _dsh_css_PrioritySkills_module_css_default.ctl,
									onClick: () => removeFrom("whitelist", index),
									"aria-label": t("remove"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconClose, {})
								})
							})]
						}, path))
					})
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: _dsh_css_PrioritySkills_module_css_default.block,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
						className: _dsh_css_PrioritySkills_module_css_default.heading,
						children: t("priorityAddManual")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: _dsh_css_PrioritySkills_module_css_default.addRow,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: _dsh_css_PrioritySkills_module_css_default.input,
								value: draft,
								placeholder: t("pathPlaceholder"),
								onChange: (e) => setDraft(e.target.value),
								onKeyDown: (e) => {
									if (e.key !== "Enter") return;
									if (e.altKey) add("whitelist", draft);
									else if (e.shiftKey) add("blacklist", draft);
									else add("prio", draft);
								}
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: _dsh_css_PrioritySkills_module_css_default.primary,
								disabled: draft.trim() === "",
								onClick: () => add("prio", draft),
								children: t("addPrio")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: _dsh_css_PrioritySkills_module_css_default.button,
								disabled: draft.trim() === "",
								onClick: () => add("blacklist", draft),
								children: t("addBlack")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: _dsh_css_PrioritySkills_module_css_default.button,
								disabled: draft.trim() === "",
								onClick: () => add("whitelist", draft),
								children: t("addWhite")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: _dsh_css_PrioritySkills_module_css_default.hint,
						children: t("manualHint")
					})
				]
			}),
			onApply !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: _dsh_css_PrioritySkills_module_css_default.actions,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: _dsh_css_PrioritySkills_module_css_default.primary,
						disabled: !isDirty || saving,
						onClick: () => {
							setSaving(true);
							onApply().finally(() => setSaving(false));
						},
						children: saving ? "…" : t("save")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: _dsh_css_PrioritySkills_module_css_default.grow }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: _dsh_css_PrioritySkills_module_css_default.state,
						children: isDirty ? t("priorityUnsaved") : t("prioritySaved")
					})
				]
			})
		]
	});
}
//#endregion
//#region src/client/SkillSection.tsx
/**
* The Skills section's three submenus: Search, Priority, Config.
*
* Tab state is local to the section (dsh-market's pattern) rather than a
* nested slot, because the three panes share state — the explorer's hits
* feed the priority picker, and the config card and the priority list both
* write the same settings document.
*/
/** Resolve an absolute route against the page the bundle runs in. */
function api(path) {
	const relative = path.replace(/^\/+/, "");
	if (typeof document === "undefined") return `/${relative}`;
	return new URL(relative, document.baseURI).pathname;
}
/**
* Render the tabbed Skills section.
* @param props - locale, scope, labels, and the forwarded pane props.
*/
function SkillSection(props) {
	const { t, scope, labels, explorer, priority } = props;
	const [tab, setTab] = (0, react.useState)("search");
	const [pending, setPending] = (0, react.useState)(false);
	/** The explorer's latest hits, offered to the priority picker. */
	const [hits, setHits] = (0, react.useState)([]);
	const onHits = (0, react.useCallback)((next) => setHits(next), []);
	/** Applied priority lists, as the route returns them. */
	const [applied, setApplied] = (0, react.useState)({
		prio: [],
		blacklist: [],
		whitelist: []
	});
	/** Staged edits on top of `applied`, until Save commits them. */
	const [staged, setStaged] = (0, react.useState)(void 0);
	(0, react.useEffect)(() => {
		let live = true;
		(async () => {
			try {
				const body = await (await fetch(api("/dsh-awesome-skills/priority"))).json();
				if (live && body.ok && Array.isArray(body.prio) && Array.isArray(body.blacklist) && Array.isArray(body.whitelist)) setApplied({
					prio: body.prio,
					blacklist: body.blacklist,
					whitelist: body.whitelist
				});
			} catch {}
		})();
		return () => {
			live = false;
		};
	}, []);
	(0, react.useCallback)((next) => {
		setStaged(next);
	}, []);
	const savePriority = (0, react.useCallback)(async () => {
		if (staged === void 0) return;
		try {
			const body = await (await fetch(api("/dsh-awesome-skills/priority"), {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(staged)
			})).json();
			if (body.ok && Array.isArray(body.prio) && Array.isArray(body.blacklist) && Array.isArray(body.whitelist)) {
				setApplied({
					prio: body.prio,
					blacklist: body.blacklist,
					whitelist: body.whitelist
				});
				setStaged(void 0);
			}
		} catch {}
	}, [staged]);
	/**
	* One skill, one list, one click: add or remove a path in a single list and
	* commit it immediately. The POST is the same writer the Priority tab's Save
	* uses, so the two surfaces cannot disagree; the applied state updates from
	* the route's answer, and a failed call leaves the optimistic edit in place
	* for a retry.
	*/
	const assign = (0, react.useCallback)(async (key, path, remove) => {
		const base = staged ?? applied;
		const current = Array.isArray(base[key]) ? base[key] : [];
		const nextList = remove ? current.filter((p) => p !== path) : [...current, path];
		setApplied({
			...base,
			[key]: nextList
		});
		setStaged(void 0);
		try {
			const body = await (await fetch(api("/dsh-awesome-skills/priority"), {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ [key]: nextList })
			})).json();
			if (body.ok && Array.isArray(body.prio) && Array.isArray(body.blacklist) && Array.isArray(body.whitelist)) setApplied({
				prio: body.prio,
				blacklist: body.blacklist,
				whitelist: body.whitelist
			});
		} catch {}
	}, [applied, staged]);
	const tabs = (0, react.useMemo)(() => [
		{
			id: "search",
			label: labels.search
		},
		{
			id: "priority",
			label: labels.priority,
			pending
		},
		{
			id: "config",
			label: labels.config
		}
	], [labels, pending]);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: _dsh_css_SectionTabs_module_css_default.tabs,
			role: "tablist",
			"aria-label": labels.section,
			children: tabs.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				role: "tab",
				"aria-selected": tab === entry.id,
				className: tab === entry.id ? _dsh_css_SectionTabs_module_css_default.tabOn : _dsh_css_SectionTabs_module_css_default.tab,
				onClick: () => setTab(entry.id),
				children: [entry.label, entry.pending && tab !== "priority" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: _dsh_css_SectionTabs_module_css_default.dot,
					"aria-hidden": true
				})]
			}, entry.id))
		}),
		tab === "search" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillExplorer, {
			...explorer,
			onHits,
			membership: applied,
			onAssign: (key, path) => {
				assign(key, path, false);
			},
			onUnassign: (key, path) => {
				assign(key, path, true);
			}
		}),
		tab === "priority" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PrioritySkills, {
			t,
			state: staged ?? applied,
			onChange: (next) => {
				setStaged(next);
				setPending(true);
			},
			suggestions: hits,
			onApply: savePriority,
			applied
		}),
		tab === "config" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingsCard, { scope })
	] });
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
//#region src/client/locales.ts
/**
* Locale dictionaries for the plugin's browser surfaces (settings card and
* the skills section). Namespaced under the plugin id so entries cannot
* collide with another plugin's strings.
*/
const en = {
	sectionTitle: "Skills",
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
	unitMin: "min",
	tabSearch: "Search",
	tabPriority: "Priority",
	tabConfig: "Config",
	prioTitle: "Priority skills",
	prioHint: "Loaded into context at the start of every turn, in this order",
	prioEmpty: "Nothing prioritised yet — search for a skill and press \"+ Prio\", or add a path below",
	addPrio: "+ Prio",
	blacklistTitle: "Blacklisted skills",
	blacklistHint: "Hidden from search results entirely",
	blacklistEmpty: "Nothing blacklisted",
	addBlack: "Black",
	whitelistTitle: "Whitelisted skills",
	whitelistHint: "When search scope is \"Whitelist only\", only these are visible",
	whitelistEmpty: "Nothing whitelisted",
	addWhite: "White",
	priorityAddManual: "Add a skill path",
	searchPlaceholder: "Search 16,000 skills by what you want to do…",
	clear: "Clear search",
	filterAll: "All",
	filterPrio: "Priority",
	filterBlack: "Blacklisted",
	filterWhite: "Whitelisted",
	chipPrio: "Priority",
	chipBlack: "Blacklisted",
	chipWhite: "Whitelisted",
	scopeLabel: "Search scope",
	scopeAll: "All skills",
	scopeWhitelist: "Whitelist only",
	scopeHint: "Whitelist only hides everything not whitelisted — no effect while the whitelist is empty",
	moveUp: "Move up",
	moveDown: "Move down",
	remove: "Remove",
	pathPlaceholder: "path/from/skills",
	manualHint: "Enter adds to Priority; Shift+Enter adds to Blacklist; Alt+Enter adds to Whitelist",
	save: "Save",
	pinnedBadge: "pinned",
	priorityUnsaved: "Unsaved changes",
	prioritySaved: "All changes applied"
};
const zh = {
	sectionTitle: "技能",
	searchPlaceholder: "用你想做的事搜索 1.6 万个技能…",
	clear: "清除搜索",
	filterAll: "全部",
	filterPrio: "优先",
	filterBlack: "黑名单",
	filterWhite: "白名单",
	chipPrio: "优先",
	chipBlack: "黑名单",
	chipWhite: "白名单",
	searchHint: "描述你想做的事情；结果由宿主端的语义搜索返回。",
	results: "{n} 条结果",
	corpusCount: "已索引 {n} 个技能",
	copyPath: "复制路径",
	copied: "已复制",
	noResultsTitle: "没有匹配的技能",
	noResults: "换个说法再试 — 语料按意图匹配，而不是精确名称。",
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
	unitMin: "分",
	tabSearch: "搜索",
	tabPriority: "优先级",
	tabConfig: "配置",
	prioTitle: "优先技能",
	prioHint: "每个回合开始时按此顺序加载到上下文",
	prioEmpty: "暂无优先技能 — 搜索后点“+ Prio”，或在下方添加路径",
	addPrio: "+ Prio",
	blacklistTitle: "黑名单技能",
	blacklistHint: "完全从搜索结果中隐藏",
	blacklistEmpty: "暂无黑名单",
	addBlack: "黑名单",
	whitelistTitle: "白名单技能",
	whitelistHint: "当搜索范围为“仅白名单”时，只显示这些技能",
	whitelistEmpty: "暂无白名单",
	addWhite: "白名单",
	priorityAddManual: "添加技能路径",
	scopeLabel: "搜索范围",
	scopeAll: "全部技能",
	scopeWhitelist: "仅白名单",
	scopeHint: "“仅白名单”会隐藏所有未列入白名单的技能 — 白名单为空时无效果",
	moveUp: "上移",
	moveDown: "下移",
	remove: "移除",
	pathPlaceholder: "路径/来自/技能",
	manualHint: "回车加入优先；Shift+回车加入黑名单；Alt+回车加入白名单",
	save: "保存",
	pinnedBadge: "置顶",
	priorityUnsaved: "有未保存的更改",
	prioritySaved: "所有更改已应用"
};
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
* Shadows the shipped details renderer: a single-slot cell renders its
* lowest live priority (ui-slots register doc, index.ts:716-722, and the
* ascending sort at 860-866 feeding entriesOfSlot 934-947), and ui-tool
* occupies the default cell (0), so -1 both avoids the same-priority
* load-time throw and wins the election.
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
	ctx.slots.inject("conversation.details.tool", () => ctx.slots.register({
		name: "conversation.details.tool",
		priority: DETAILS_PRIORITY,
		locale: NS
	}, SkillPickDetails));
	ctx.inject(["slots", "settingsScope"], (scoped) => {
		const slotsCtx = scoped;
		const t = ctx.locale.bind(NS);
		const scope = slotsCtx.settingsScope.bind({ namespace: NS });
		slotsCtx.slots.inject("settings.section", () => slotsCtx.slots.register({
			name: "settings.section",
			id: "skills",
			order: SECTION_ORDER,
			label: () => t("sectionTitle"),
			locale: NS,
			inject: () => ({
				t,
				scope
			})
		}, () => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillSection, {
			t,
			scope,
			labels: {
				section: t("sectionTitle"),
				search: t("tabSearch"),
				priority: t("tabPriority"),
				config: t("tabConfig")
			},
			explorer: { t },
			priority: {}
		})));
	});
}
//#endregion
exports.apply = apply;
exports.inject = inject;

return module.exports; } });
//# sourceMappingURL=client.js.map