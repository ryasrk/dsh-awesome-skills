/**
 * Locale dictionaries for the plugin's browser surfaces (settings card and
 * the skills section). Namespaced under the plugin id so entries cannot
 * collide with another plugin's strings.
 */
export declare const en: {
    readonly sectionTitle: "Skills";
    readonly searchHint: "Describe what you want to do; results come from semantic search on the host.";
    readonly results: "{n} results";
    readonly corpusCount: "{n} skills indexed";
    readonly copyPath: "Copy path";
    readonly copied: "Copied";
    readonly copyFailed: "Copy failed";
    readonly noResultsTitle: "No skills matched";
    readonly noResults: "No skills matched.";
    readonly error: "Search failed. Try again.";
    readonly loading: "Searching…";
    readonly cardTitle: "dsh-awesome-skills";
    readonly cardDescription: "Semantic search over the local 16,000-skill corpus";
    readonly fieldSemantic: "Semantic lane";
    readonly fieldSemanticHint: "Vector similarity (wasm). Off falls back to lexical + n-gram only";
    readonly fieldDefaultK: "Results per search";
    readonly fieldDefaultKHint: "How many hits search() returns (1-25)";
    readonly fieldPool: "Candidate pool";
    readonly fieldPoolHint: "Candidates re-ranked before the top results are chosen (50-3000)";
    readonly fieldWLex: "Lexical weight";
    readonly fieldWLexHint: "Weight of the keyword-overlap lane (0-1)";
    readonly fieldWGram: "N-gram weight";
    readonly fieldWGramHint: "Weight of the character-trigram lane (0-1)";
    readonly fieldAutoRoute: "Keep skill-router in step";
    readonly fieldAutoRouteHint: "Rewrite the installed skill-router when these values change";
    readonly detailSkillTitle: "Skill picked";
    readonly detailUnknownName: "name unavailable";
    readonly detailUnknownTool: "Unknown tool call";
    readonly detailTool: "Tool";
    readonly detailRunning: "Running…";
    readonly detailDuration: "Duration";
    readonly detailArgs: "Arguments";
    readonly detailOutput: "Output";
    readonly detailError: "Failed";
    readonly detailTruncated: "(truncated)";
    readonly unitMs: "ms";
    readonly unitS: "s";
    readonly unitMin: "min";
    readonly tabSearch: "Search";
    readonly tabPriority: "Priority";
    readonly tabConfig: "Config";
    readonly prioTitle: "Priority skills";
    readonly prioHint: "Loaded into context at the start of every turn, in this order";
    readonly prioEmpty: "Nothing prioritised yet — search for a skill and press \"+ Priority\", or add a path below";
    readonly addPrio: "+ Priority";
    readonly blacklistTitle: "Blacklisted skills";
    readonly blacklistHint: "Hidden from search results entirely";
    readonly blacklistEmpty: "Nothing blacklisted";
    readonly addBlack: "+ Blacklisted";
    readonly whitelistTitle: "Whitelisted skills";
    readonly whitelistHint: "When search scope is \"Whitelist only\", only these are visible";
    readonly whitelistEmpty: "Nothing whitelisted";
    readonly addWhite: "+ Whitelisted";
    readonly priorityAddManual: "Add a skill path";
    readonly searchPlaceholder: "Search 16,000 skills by what you want to do…";
    readonly clear: "Clear search";
    readonly filterAll: "All";
    readonly filterPrio: "Priority";
    readonly filterBlack: "Blacklisted";
    readonly filterWhite: "Whitelisted";
    readonly chipPrio: "Priority";
    readonly chipBlack: "Blacklisted";
    readonly chipWhite: "Whitelisted";
    readonly scopeLabel: "Search scope";
    readonly scopeAll: "All skills";
    readonly scopeWhitelist: "Whitelist only";
    readonly scopeHint: "Whitelist only hides everything not whitelisted — no effect while the whitelist is empty";
    readonly moveUp: "Move up";
    readonly moveDown: "Move down";
    readonly remove: "Remove";
    readonly pathPlaceholder: "path/from/skills";
    readonly manualHint: "Type to filter recent results; ↑↓ to choose, Enter adds to the selected list";
    readonly save: "Save";
    readonly priorityUnsaved: "Unsaved changes";
    readonly prioritySaved: "All changes applied";
    readonly priorityDiscard: "Discard";
    readonly prioritySaveFailed: "Save failed — your edits are kept; retry";
    readonly priorityAssignFailed: "Couldn’t apply that change — try again";
    readonly duplicateSkill: "Already in {list}";
    readonly targetLabel: "Add to list";
    readonly diffReordered: "Reordered";
    readonly noMatch: "No suggestion matches — press Enter to add the path as typed";
    readonly whitelistEmptyWarn: "Search scope is “Whitelist only”, so an empty whitelist hides every skill. Add to the whitelist or switch the scope in Config.";
    readonly retry: "Retry";
    readonly priorityLoadFailed: "Could not load your lists. Editing is paused until they load.";
};
/** Record<keyof typeof en, string> makes the zh mirror a compile contract:
    a key missing from either side is a type error, not a blank label. */
export declare const zh: Record<keyof typeof en, string>;
//# sourceMappingURL=locales.d.ts.map