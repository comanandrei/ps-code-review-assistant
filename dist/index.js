const config_1 = __nccwpck_require__(1234);
Here are the tools/framework/libraries that are used in the project: ${config_1.PROMPT}
exports.URL = exports.EXCLUDE = exports.PROMPT = exports.PS_CHAT_TOKEN = exports.GITHUB_TOKEN = void 0;
exports.PROMPT = core.getInput("prompt");
exports.EXCLUDE = core.getInput("exclude");
        console.log("====process.env.GITHUB_EVENT_PATH", process.env.GITHUB_EVENT_PATH);
        const excludePatterns = config_1.EXCLUDE.split(",").map((s) => s.trim());
        console.log("======= end ===========");
                    model: "gtp4",
/***/ 2170:
const DecoratorHandler = __nccwpck_require__(8468)
/***/ 8468:
const proxyFromEnv = __nccwpck_require__(2170);