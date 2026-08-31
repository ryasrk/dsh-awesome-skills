/**
 * Semantic search over the bundled skill corpus.
 *
 * Ported from the standalone `~/.dsh/awesome-skills/runtime` scripts, keeping
 * the calibrated hybrid ranking (semantic + lexical IDF + char 3-gram) and the
 * lazy gram cache. The corpus is NOT a skill discovery root, so 16,000 skills
 * never enter the per-turn model catalog.
 */
/** Embedding dimensionality of all-MiniLM-L6-v2. */
export declare const DIM = 384;
/** Candidate pool fed to the reranker. 50 was tuned for a 677-skill corpus. */
export declare const POOL = 1200;
export interface SkillEntry {
    name: string;
    path: string;
    description: string;
}
export interface SearchHit {
    name: string;
    path: string;
    score: number;
    description: string;
}
export interface SearchOptions {
    /** Absolute path to the corpus (directory of `<name>/SKILL.md`). */
    corpusDir: string;
    /** Directory holding skills.json and vectors.f32. */
    indexDir: string;
    /** Directory holding the ONNX model + tokenizer. */
    modelDir: string;
    /** Directory for derived caches (grams, query embeddings). */
    cacheDir: string;
}
/** An index over one corpus. Build once, query many times. */
export declare class SkillIndex {
    private readonly opts;
    private meta;
    private packed;
    private session;
    private ort;
    private vocab;
    private unk;
    private df;
    private docGrams;
    private docGramNorms;
    private gramsDirty;
    private gramsFromCache;
    private qcache;
    private readonly files;
    constructor(opts: SearchOptions);
    /** Number of indexed skills. */
    count(): number;
    /** Load the corpus files if they are not loaded yet. Idempotent. */
    ensureLoaded(): void;
    private loadCorpus;
    private ensureModel;
    private wordpiece;
    private encode;
    private static pool;
    /** Embed one text. L2-normalized mean pooling. */
    embed(text: string): Promise<Float32Array>;
    private buildDf;
    private idf;
    private lexical;
    private static grams;
    private static gramCos;
    private corpusFingerprint;
    private loadGramCache;
    private saveGramCache;
    private gramsFor;
    private cacheGet;
    private cacheSet;
    /**
     * Search the corpus.
     * @param query - a plain-language description of the goal.
     * @param k - number of results, clamped to 25.
     * @returns ranked hits, best first.
     */
    search(query: string, k?: number): Promise<SearchHit[]>;
    private hit;
    private clip;
    /** Absolute path of a skill's directory, for reading its SKILL.md. */
    skillDir(path: string): string;
}
/**
 * Register the search service on the host context.
 * @returns the service, for callers that want it directly.
 */
export declare function registerSearchService(ctx: {
    logger: {
        info(m: string): void;
        warn(m: string): void;
    };
}, opts: {
    corpusDir: string;
    indexDir: string;
    runtimeDir: string;
}): SkillsSearch;
export interface SkillsSearch {
    /** Number of indexed skills. */
    count(): number;
    /** Semantic search over the corpus. */
    search(query: string, k?: number): Promise<SearchHit[]>;
    /** Absolute directory holding a skill's SKILL.md. */
    skillDir(path: string): string;
}
//# sourceMappingURL=search.d.ts.map