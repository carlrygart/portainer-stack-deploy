require('./sourcemap-register.js');/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 8947:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createPortainerApi = void 0;
const mappersmith_1 = __importStar(__nccwpck_require__(250));
const encode_json_1 = __importDefault(__nccwpck_require__(272));
const AccessTokenMiddleware = ({ context }) => ({
    request(request) {
        return request.enhance({
            headers: { Authorization: `Bearer ${context.jwtToken}` }
        });
    }
});
const SetAccessTokenMiddleware = () => ({
    async response(next) {
        return next().then(response => {
            const { jwt } = response.data();
            (0, mappersmith_1.setContext)({ jwtToken: jwt });
            return response;
        });
    }
});
function createPortainerApi({ host }) {
    return (0, mappersmith_1.default)({
        clientId: 'portainerClient',
        host,
        middleware: [encode_json_1.default],
        resources: {
            Auth: {
                login: {
                    path: '/auth',
                    method: 'post',
                    middleware: [SetAccessTokenMiddleware]
                },
                logout: {
                    path: '/auth/logout',
                    method: 'post',
                    middleware: [AccessTokenMiddleware]
                }
            },
            Stacks: {
                all: {
                    path: '/stacks',
                    middleware: [AccessTokenMiddleware]
                },
                createStack: {
                    path: '/stacks',
                    method: 'post',
                    middleware: [AccessTokenMiddleware]
                },
                updateStack: {
                    path: '/stacks/{id}',
                    method: 'put',
                    middleware: [AccessTokenMiddleware]
                }
            }
        }
    });
}
exports.createPortainerApi = createPortainerApi;


/***/ }),

/***/ 2090:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deployStack = void 0;
const api_1 = __nccwpck_require__(947);
const path_1 = __importDefault(__nccwpck_require__(17));
const fs_1 = __importDefault(__nccwpck_require__(147));
const core = __importStar(__nccwpck_require__(186));
var StackType;
(function (StackType) {
    StackType[StackType["SWARM"] = 1] = "SWARM";
    StackType[StackType["COMPOSE"] = 2] = "COMPOSE";
})(StackType || (StackType = {}));
function generateNewStackDefinition(stackDefinitionFile, variables, image) {
    const stackDefFilePath = path_1.default.join(process.env.GITHUB_WORKSPACE, stackDefinitionFile);
    core.info(`Reading stack definition file from ${stackDefFilePath}`);
    let stackDefinition = fs_1.default.readFileSync(stackDefFilePath, 'utf8');
    if (!stackDefinition) {
        throw new Error(`Could not find stack-definition file: ${stackDefFilePath}`);
    }
    if (variables) {
        core.info(`Applying variables: ${variables}`);
        const variablesObject = JSON.parse(variables);
        const template = handlebars_1.default.compile(stackDefinition);
        stackDefinition = template(variablesObject);
    }
    if (!image) {
        core.info(`No new image provided, using existing stack definition`);
        return stackDefinition;
    }
    const imageWithoutTag = image.substring(0, image.indexOf(':'));
    core.info(`Inserting image ${image} into the stack definition`);
    return stackDefinition.replace(new RegExp(`${imageWithoutTag}(:.*)?\n`), `${image}\n`);
}
async function deployStack({ portainerHost, username, password, swarmId, stackName, stackDefinitionFile, image }) {
    const portainerApi = (0, api_1.createPortainerApi)({ host: `${portainerHost}/api` });
    const stackDefinitionToDeploy = generateNewStackDefinition(stackDefinitionFile, image);
    core.debug(stackDefinitionToDeploy);
    core.info('Logging in to Portainer instance...');
    await portainerApi.Auth.login({
        body: {
            username,
            password
        }
    });
    try {
        const allStacks = (await portainerApi.Stacks.all()).data();
        const existingStack = allStacks.find((s) => s.Name === stackName);
        if (existingStack) {
            core.info(`Found existing stack with name: ${stackName}`);
            core.info('Updating existing stack...');
            await portainerApi.Stacks.updateStack({
                id: existingStack.Id,
                endpointId: existingStack.EndpointId,
                body: {
                    stackFileContent: stackDefinitionToDeploy
                }
            });
            core.info('Successfully updated existing stack');
        }
        else {
            core.info('Deploying new stack...');
            await portainerApi.Stacks.createStack({
                type: swarmId ? StackType.SWARM : StackType.COMPOSE,
                method: 'string',
                endpointId: 1,
                body: {
                    name: stackName,
                    stackFileContent: stackDefinitionToDeploy,
                    swarmID: swarmId ? swarmId : undefined
                }
            });
            core.info(`Successfully created new stack with name: ${stackName}`);
        }
    }
    catch (error) {
        core.info('⛔️ Something went wrong during deployment!');
        throw error;
    }
    finally {
        core.info(`Logging out from Portainer instance...`);
        await portainerApi.Auth.logout();
    }
}
exports.deployStack = deployStack;


/***/ }),

/***/ 3109:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.run = void 0;
const core = __importStar(__nccwpck_require__(186));
const deployStack_1 = __nccwpck_require__(90);
async function run() {
    var _a, _b, _c, _d;
    try {
        const portainerHost = core.getInput('portainer-host', {
            required: true
        });
        const username = core.getInput('username', {
            required: true
        });
        const password = core.getInput('password', {
            required: true
        });
        const swarmId = core.getInput('swarm-id', {
            required: false
        });
        const endpointId = core.getInput('endpoint-id', {
            required: true
        });
        const stackName = core.getInput('stack-name', {
            required: true
        });
        const stackDefinitionFile = core.getInput('stack-definition', {
            required: true
        });
        const variables = core.getInput('variables', {
            required: false
        });
        const image = core.getInput('image', {
            required: false
        });
        await (0, deployStack_1.deployStack)({
            portainerHost,
            username,
            password,
            swarmId,
            endpointId,
            stackName,
            stackDefinitionFile,
            variables,
            image
        });
        core.info('✅ Deployment done');
    }
    catch (error) {
        if (error instanceof Error) {
            return core.setFailed(error.message);
        }
        const mappersmithError = error;
        if (typeof mappersmithError === 'object' &&
            mappersmithError.responseStatus &&
            mappersmithError.responseData &&
            ((_b = (_a = mappersmithError.originalRequest) === null || _a === void 0 ? void 0 : _a.methodDescriptor) === null || _b === void 0 ? void 0 : _b.path) &&
            ((_d = (_c = mappersmithError.originalRequest) === null || _c === void 0 ? void 0 : _c.methodDescriptor) === null || _d === void 0 ? void 0 : _d.method)) {
            return core.setFailed(`HTTP Status ${mappersmithError.responseStatus} (${mappersmithError.originalRequest.methodDescriptor.method} ${mappersmithError.originalRequest.methodDescriptor.path}): ${mappersmithError.responseData}`);
        }
        return core.setFailed(error);
    }
}
exports.run = run;
run();


/***/ }),

/***/ 7351:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.issue = exports.issueCommand = void 0;
const os = __importStar(__nccwpck_require__(37));
const utils_1 = __nccwpck_require__(278);
/**
 * Commands
 *
 * Command Format:
 *   ::name key=value,key=value::message
 *
 * Examples:
 *   ::warning::This is the message
 *   ::set-env name=MY_VAR::some value
 */
function issueCommand(command, properties, message) {
    const cmd = new Command(command, properties, message);
    process.stdout.write(cmd.toString() + os.EOL);
}
exports.issueCommand = issueCommand;
function issue(name, message = '') {
    issueCommand(name, {}, message);
}
exports.issue = issue;
const CMD_STRING = '::';
class Command {
    constructor(command, properties, message) {
        if (!command) {
            command = 'missing.command';
        }
        this.command = command;
        this.properties = properties;
        this.message = message;
    }
    toString() {
        let cmdStr = CMD_STRING + this.command;
        if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += ' ';
            let first = true;
            for (const key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    const val = this.properties[key];
                    if (val) {
                        if (first) {
                            first = false;
                        }
                        else {
                            cmdStr += ',';
                        }
                        cmdStr += `${key}=${escapeProperty(val)}`;
                    }
                }
            }
        }
        cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
        return cmdStr;
    }
}
function escapeData(s) {
    return utils_1.toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A');
}
function escapeProperty(s) {
    return utils_1.toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
        .replace(/:/g, '%3A')
        .replace(/,/g, '%2C');
}
//# sourceMappingURL=command.js.map

/***/ }),

/***/ 2186:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getIDToken = exports.getState = exports.saveState = exports.group = exports.endGroup = exports.startGroup = exports.info = exports.notice = exports.warning = exports.error = exports.debug = exports.isDebug = exports.setFailed = exports.setCommandEcho = exports.setOutput = exports.getBooleanInput = exports.getMultilineInput = exports.getInput = exports.addPath = exports.setSecret = exports.exportVariable = exports.ExitCode = void 0;
const command_1 = __nccwpck_require__(351);
const file_command_1 = __nccwpck_require__(717);
const utils_1 = __nccwpck_require__(278);
const os = __importStar(__nccwpck_require__(37));
const path = __importStar(__nccwpck_require__(17));
const oidc_utils_1 = __nccwpck_require__(41);
/**
 * The code to exit an action
 */
var ExitCode;
(function (ExitCode) {
    /**
     * A code indicating that the action was successful
     */
    ExitCode[ExitCode["Success"] = 0] = "Success";
    /**
     * A code indicating that the action was a failure
     */
    ExitCode[ExitCode["Failure"] = 1] = "Failure";
})(ExitCode = exports.ExitCode || (exports.ExitCode = {}));
//-----------------------------------------------------------------------
// Variables
//-----------------------------------------------------------------------
/**
 * Sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportVariable(name, val) {
    const convertedVal = utils_1.toCommandValue(val);
    process.env[name] = convertedVal;
    const filePath = process.env['GITHUB_ENV'] || '';
    if (filePath) {
        const delimiter = '_GitHubActionsFileCommandDelimeter_';
        const commandValue = `${name}<<${delimiter}${os.EOL}${convertedVal}${os.EOL}${delimiter}`;
        file_command_1.issueCommand('ENV', commandValue);
    }
    else {
        command_1.issueCommand('set-env', { name }, convertedVal);
    }
}
exports.exportVariable = exportVariable;
/**
 * Registers a secret which will get masked from logs
 * @param secret value of the secret
 */
function setSecret(secret) {
    command_1.issueCommand('add-mask', {}, secret);
}
exports.setSecret = setSecret;
/**
 * Prepends inputPath to the PATH (for this action and future actions)
 * @param inputPath
 */
function addPath(inputPath) {
    const filePath = process.env['GITHUB_PATH'] || '';
    if (filePath) {
        file_command_1.issueCommand('PATH', inputPath);
    }
    else {
        command_1.issueCommand('add-path', {}, inputPath);
    }
    process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`;
}
exports.addPath = addPath;
/**
 * Gets the value of an input.
 * Unless trimWhitespace is set to false in InputOptions, the value is also trimmed.
 * Returns an empty string if the value is not defined.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
function getInput(name, options) {
    const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
    if (options && options.required && !val) {
        throw new Error(`Input required and not supplied: ${name}`);
    }
    if (options && options.trimWhitespace === false) {
        return val;
    }
    return val.trim();
}
exports.getInput = getInput;
/**
 * Gets the values of an multiline input.  Each value is also trimmed.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string[]
 *
 */
function getMultilineInput(name, options) {
    const inputs = getInput(name, options)
        .split('\n')
        .filter(x => x !== '');
    return inputs;
}
exports.getMultilineInput = getMultilineInput;
/**
 * Gets the input value of the boolean type in the YAML 1.2 "core schema" specification.
 * Support boolean input list: `true | True | TRUE | false | False | FALSE` .
 * The return value is also in boolean type.
 * ref: https://yaml.org/spec/1.2/spec.html#id2804923
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   boolean
 */
function getBooleanInput(name, options) {
    const trueValue = ['true', 'True', 'TRUE'];
    const falseValue = ['false', 'False', 'FALSE'];
    const val = getInput(name, options);
    if (trueValue.includes(val))
        return true;
    if (falseValue.includes(val))
        return false;
    throw new TypeError(`Input does not meet YAML 1.2 "Core Schema" specification: ${name}\n` +
        `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``);
}
exports.getBooleanInput = getBooleanInput;
/**
 * Sets the value of an output.
 *
 * @param     name     name of the output to set
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setOutput(name, value) {
    process.stdout.write(os.EOL);
    command_1.issueCommand('set-output', { name }, value);
}
exports.setOutput = setOutput;
/**
 * Enables or disables the echoing of commands into stdout for the rest of the step.
 * Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
 *
 */
function setCommandEcho(enabled) {
    command_1.issue('echo', enabled ? 'on' : 'off');
}
exports.setCommandEcho = setCommandEcho;
//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------
/**
 * Sets the action status to failed.
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
function setFailed(message) {
    process.exitCode = ExitCode.Failure;
    error(message);
}
exports.setFailed = setFailed;
//-----------------------------------------------------------------------
// Logging Commands
//-----------------------------------------------------------------------
/**
 * Gets whether Actions Step Debug is on or not
 */
function isDebug() {
    return process.env['RUNNER_DEBUG'] === '1';
}
exports.isDebug = isDebug;
/**
 * Writes debug message to user log
 * @param message debug message
 */
function debug(message) {
    command_1.issueCommand('debug', {}, message);
}
exports.debug = debug;
/**
 * Adds an error issue
 * @param message error issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
function error(message, properties = {}) {
    command_1.issueCommand('error', utils_1.toCommandProperties(properties), message instanceof Error ? message.toString() : message);
}
exports.error = error;
/**
 * Adds a warning issue
 * @param message warning issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
function warning(message, properties = {}) {
    command_1.issueCommand('warning', utils_1.toCommandProperties(properties), message instanceof Error ? message.toString() : message);
}
exports.warning = warning;
/**
 * Adds a notice issue
 * @param message notice issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
function notice(message, properties = {}) {
    command_1.issueCommand('notice', utils_1.toCommandProperties(properties), message instanceof Error ? message.toString() : message);
}
exports.notice = notice;
/**
 * Writes info to log with console.log.
 * @param message info message
 */
function info(message) {
    process.stdout.write(message + os.EOL);
}
exports.info = info;
/**
 * Begin an output group.
 *
 * Output until the next `groupEnd` will be foldable in this group
 *
 * @param name The name of the output group
 */
function startGroup(name) {
    command_1.issue('group', name);
}
exports.startGroup = startGroup;
/**
 * End an output group.
 */
function endGroup() {
    command_1.issue('endgroup');
}
exports.endGroup = endGroup;
/**
 * Wrap an asynchronous function call in a group.
 *
 * Returns the same type as the function itself.
 *
 * @param name The name of the group
 * @param fn The function to wrap in the group
 */
function group(name, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        startGroup(name);
        let result;
        try {
            result = yield fn();
        }
        finally {
            endGroup();
        }
        return result;
    });
}
exports.group = group;
//-----------------------------------------------------------------------
// Wrapper action state
//-----------------------------------------------------------------------
/**
 * Saves state for current action, the state can only be retrieved by this action's post job execution.
 *
 * @param     name     name of the state to store
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function saveState(name, value) {
    command_1.issueCommand('save-state', { name }, value);
}
exports.saveState = saveState;
/**
 * Gets the value of an state set by this action's main execution.
 *
 * @param     name     name of the state to get
 * @returns   string
 */
function getState(name) {
    return process.env[`STATE_${name}`] || '';
}
exports.getState = getState;
function getIDToken(aud) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield oidc_utils_1.OidcClient.getIDToken(aud);
    });
}
exports.getIDToken = getIDToken;
//# sourceMappingURL=core.js.map

/***/ }),

/***/ 717:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

// For internal use, subject to change.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.issueCommand = void 0;
// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
const fs = __importStar(__nccwpck_require__(147));
const os = __importStar(__nccwpck_require__(37));
const utils_1 = __nccwpck_require__(278);
function issueCommand(command, message) {
    const filePath = process.env[`GITHUB_${command}`];
    if (!filePath) {
        throw new Error(`Unable to find environment variable for file command ${command}`);
    }
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing file at path: ${filePath}`);
    }
    fs.appendFileSync(filePath, `${utils_1.toCommandValue(message)}${os.EOL}`, {
        encoding: 'utf8'
    });
}
exports.issueCommand = issueCommand;
//# sourceMappingURL=file-command.js.map

/***/ }),

/***/ 41:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OidcClient = void 0;
const http_client_1 = __nccwpck_require__(925);
const auth_1 = __nccwpck_require__(702);
const core_1 = __nccwpck_require__(186);
class OidcClient {
    static createHttpClient(allowRetry = true, maxRetry = 10) {
        const requestOptions = {
            allowRetries: allowRetry,
            maxRetries: maxRetry
        };
        return new http_client_1.HttpClient('actions/oidc-client', [new auth_1.BearerCredentialHandler(OidcClient.getRequestToken())], requestOptions);
    }
    static getRequestToken() {
        const token = process.env['ACTIONS_ID_TOKEN_REQUEST_TOKEN'];
        if (!token) {
            throw new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_TOKEN env variable');
        }
        return token;
    }
    static getIDTokenUrl() {
        const runtimeUrl = process.env['ACTIONS_ID_TOKEN_REQUEST_URL'];
        if (!runtimeUrl) {
            throw new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable');
        }
        return runtimeUrl;
    }
    static getCall(id_token_url) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const httpclient = OidcClient.createHttpClient();
            const res = yield httpclient
                .getJson(id_token_url)
                .catch(error => {
                throw new Error(`Failed to get ID Token. \n 
        Error Code : ${error.statusCode}\n 
        Error Message: ${error.result.message}`);
            });
            const id_token = (_a = res.result) === null || _a === void 0 ? void 0 : _a.value;
            if (!id_token) {
                throw new Error('Response json body do not have ID Token field');
            }
            return id_token;
        });
    }
    static getIDToken(audience) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // New ID Token is requested from action service
                let id_token_url = OidcClient.getIDTokenUrl();
                if (audience) {
                    const encodedAudience = encodeURIComponent(audience);
                    id_token_url = `${id_token_url}&audience=${encodedAudience}`;
                }
                core_1.debug(`ID token url is ${id_token_url}`);
                const id_token = yield OidcClient.getCall(id_token_url);
                core_1.setSecret(id_token);
                return id_token;
            }
            catch (error) {
                throw new Error(`Error message: ${error.message}`);
            }
        });
    }
}
exports.OidcClient = OidcClient;
//# sourceMappingURL=oidc-utils.js.map

/***/ }),

/***/ 278:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toCommandProperties = exports.toCommandValue = void 0;
/**
 * Sanitizes an input into a string so it can be passed into issueCommand safely
 * @param input input to sanitize into a string
 */
function toCommandValue(input) {
    if (input === null || input === undefined) {
        return '';
    }
    else if (typeof input === 'string' || input instanceof String) {
        return input;
    }
    return JSON.stringify(input);
}
exports.toCommandValue = toCommandValue;
/**
 *
 * @param annotationProperties
 * @returns The command properties to send with the actual annotation command
 * See IssueCommandProperties: https://github.com/actions/runner/blob/main/src/Runner.Worker/ActionCommandManager.cs#L646
 */
function toCommandProperties(annotationProperties) {
    if (!Object.keys(annotationProperties).length) {
        return {};
    }
    return {
        title: annotationProperties.title,
        file: annotationProperties.file,
        line: annotationProperties.startLine,
        endLine: annotationProperties.endLine,
        col: annotationProperties.startColumn,
        endColumn: annotationProperties.endColumn
    };
}
exports.toCommandProperties = toCommandProperties;
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 702:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
class BasicCredentialHandler {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }
    prepareRequest(options) {
        options.headers['Authorization'] =
            'Basic ' +
                Buffer.from(this.username + ':' + this.password).toString('base64');
    }
    // This handler cannot handle 401
    canHandleAuthentication(response) {
        return false;
    }
    handleAuthentication(httpClient, requestInfo, objs) {
        return null;
    }
}
exports.BasicCredentialHandler = BasicCredentialHandler;
class BearerCredentialHandler {
    constructor(token) {
        this.token = token;
    }
    // currently implements pre-authorization
    // TODO: support preAuth = false where it hooks on 401
    prepareRequest(options) {
        options.headers['Authorization'] = 'Bearer ' + this.token;
    }
    // This handler cannot handle 401
    canHandleAuthentication(response) {
        return false;
    }
    handleAuthentication(httpClient, requestInfo, objs) {
        return null;
    }
}
exports.BearerCredentialHandler = BearerCredentialHandler;
class PersonalAccessTokenCredentialHandler {
    constructor(token) {
        this.token = token;
    }
    // currently implements pre-authorization
    // TODO: support preAuth = false where it hooks on 401
    prepareRequest(options) {
        options.headers['Authorization'] =
            'Basic ' + Buffer.from('PAT:' + this.token).toString('base64');
    }
    // This handler cannot handle 401
    canHandleAuthentication(response) {
        return false;
    }
    handleAuthentication(httpClient, requestInfo, objs) {
        return null;
    }
}
exports.PersonalAccessTokenCredentialHandler = PersonalAccessTokenCredentialHandler;


/***/ }),

/***/ 925:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const http = __nccwpck_require__(685);
const https = __nccwpck_require__(687);
const pm = __nccwpck_require__(443);
let tunnel;
var HttpCodes;
(function (HttpCodes) {
    HttpCodes[HttpCodes["OK"] = 200] = "OK";
    HttpCodes[HttpCodes["MultipleChoices"] = 300] = "MultipleChoices";
    HttpCodes[HttpCodes["MovedPermanently"] = 301] = "MovedPermanently";
    HttpCodes[HttpCodes["ResourceMoved"] = 302] = "ResourceMoved";
    HttpCodes[HttpCodes["SeeOther"] = 303] = "SeeOther";
    HttpCodes[HttpCodes["NotModified"] = 304] = "NotModified";
    HttpCodes[HttpCodes["UseProxy"] = 305] = "UseProxy";
    HttpCodes[HttpCodes["SwitchProxy"] = 306] = "SwitchProxy";
    HttpCodes[HttpCodes["TemporaryRedirect"] = 307] = "TemporaryRedirect";
    HttpCodes[HttpCodes["PermanentRedirect"] = 308] = "PermanentRedirect";
    HttpCodes[HttpCodes["BadRequest"] = 400] = "BadRequest";
    HttpCodes[HttpCodes["Unauthorized"] = 401] = "Unauthorized";
    HttpCodes[HttpCodes["PaymentRequired"] = 402] = "PaymentRequired";
    HttpCodes[HttpCodes["Forbidden"] = 403] = "Forbidden";
    HttpCodes[HttpCodes["NotFound"] = 404] = "NotFound";
    HttpCodes[HttpCodes["MethodNotAllowed"] = 405] = "MethodNotAllowed";
    HttpCodes[HttpCodes["NotAcceptable"] = 406] = "NotAcceptable";
    HttpCodes[HttpCodes["ProxyAuthenticationRequired"] = 407] = "ProxyAuthenticationRequired";
    HttpCodes[HttpCodes["RequestTimeout"] = 408] = "RequestTimeout";
    HttpCodes[HttpCodes["Conflict"] = 409] = "Conflict";
    HttpCodes[HttpCodes["Gone"] = 410] = "Gone";
    HttpCodes[HttpCodes["TooManyRequests"] = 429] = "TooManyRequests";
    HttpCodes[HttpCodes["InternalServerError"] = 500] = "InternalServerError";
    HttpCodes[HttpCodes["NotImplemented"] = 501] = "NotImplemented";
    HttpCodes[HttpCodes["BadGateway"] = 502] = "BadGateway";
    HttpCodes[HttpCodes["ServiceUnavailable"] = 503] = "ServiceUnavailable";
    HttpCodes[HttpCodes["GatewayTimeout"] = 504] = "GatewayTimeout";
})(HttpCodes = exports.HttpCodes || (exports.HttpCodes = {}));
var Headers;
(function (Headers) {
    Headers["Accept"] = "accept";
    Headers["ContentType"] = "content-type";
})(Headers = exports.Headers || (exports.Headers = {}));
var MediaTypes;
(function (MediaTypes) {
    MediaTypes["ApplicationJson"] = "application/json";
})(MediaTypes = exports.MediaTypes || (exports.MediaTypes = {}));
/**
 * Returns the proxy URL, depending upon the supplied url and proxy environment variables.
 * @param serverUrl  The server URL where the request will be sent. For example, https://api.github.com
 */
function getProxyUrl(serverUrl) {
    let proxyUrl = pm.getProxyUrl(new URL(serverUrl));
    return proxyUrl ? proxyUrl.href : '';
}
exports.getProxyUrl = getProxyUrl;
const HttpRedirectCodes = [
    HttpCodes.MovedPermanently,
    HttpCodes.ResourceMoved,
    HttpCodes.SeeOther,
    HttpCodes.TemporaryRedirect,
    HttpCodes.PermanentRedirect
];
const HttpResponseRetryCodes = [
    HttpCodes.BadGateway,
    HttpCodes.ServiceUnavailable,
    HttpCodes.GatewayTimeout
];
const RetryableHttpVerbs = ['OPTIONS', 'GET', 'DELETE', 'HEAD'];
const ExponentialBackoffCeiling = 10;
const ExponentialBackoffTimeSlice = 5;
class HttpClientError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = 'HttpClientError';
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, HttpClientError.prototype);
    }
}
exports.HttpClientError = HttpClientError;
class HttpClientResponse {
    constructor(message) {
        this.message = message;
    }
    readBody() {
        return new Promise(async (resolve, reject) => {
            let output = Buffer.alloc(0);
            this.message.on('data', (chunk) => {
                output = Buffer.concat([output, chunk]);
            });
            this.message.on('end', () => {
                resolve(output.toString());
            });
        });
    }
}
exports.HttpClientResponse = HttpClientResponse;
function isHttps(requestUrl) {
    let parsedUrl = new URL(requestUrl);
    return parsedUrl.protocol === 'https:';
}
exports.isHttps = isHttps;
class HttpClient {
    constructor(userAgent, handlers, requestOptions) {
        this._ignoreSslError = false;
        this._allowRedirects = true;
        this._allowRedirectDowngrade = false;
        this._maxRedirects = 50;
        this._allowRetries = false;
        this._maxRetries = 1;
        this._keepAlive = false;
        this._disposed = false;
        this.userAgent = userAgent;
        this.handlers = handlers || [];
        this.requestOptions = requestOptions;
        if (requestOptions) {
            if (requestOptions.ignoreSslError != null) {
                this._ignoreSslError = requestOptions.ignoreSslError;
            }
            this._socketTimeout = requestOptions.socketTimeout;
            if (requestOptions.allowRedirects != null) {
                this._allowRedirects = requestOptions.allowRedirects;
            }
            if (requestOptions.allowRedirectDowngrade != null) {
                this._allowRedirectDowngrade = requestOptions.allowRedirectDowngrade;
            }
            if (requestOptions.maxRedirects != null) {
                this._maxRedirects = Math.max(requestOptions.maxRedirects, 0);
            }
            if (requestOptions.keepAlive != null) {
                this._keepAlive = requestOptions.keepAlive;
            }
            if (requestOptions.allowRetries != null) {
                this._allowRetries = requestOptions.allowRetries;
            }
            if (requestOptions.maxRetries != null) {
                this._maxRetries = requestOptions.maxRetries;
            }
        }
    }
    options(requestUrl, additionalHeaders) {
        return this.request('OPTIONS', requestUrl, null, additionalHeaders || {});
    }
    get(requestUrl, additionalHeaders) {
        return this.request('GET', requestUrl, null, additionalHeaders || {});
    }
    del(requestUrl, additionalHeaders) {
        return this.request('DELETE', requestUrl, null, additionalHeaders || {});
    }
    post(requestUrl, data, additionalHeaders) {
        return this.request('POST', requestUrl, data, additionalHeaders || {});
    }
    patch(requestUrl, data, additionalHeaders) {
        return this.request('PATCH', requestUrl, data, additionalHeaders || {});
    }
    put(requestUrl, data, additionalHeaders) {
        return this.request('PUT', requestUrl, data, additionalHeaders || {});
    }
    head(requestUrl, additionalHeaders) {
        return this.request('HEAD', requestUrl, null, additionalHeaders || {});
    }
    sendStream(verb, requestUrl, stream, additionalHeaders) {
        return this.request(verb, requestUrl, stream, additionalHeaders);
    }
    /**
     * Gets a typed object from an endpoint
     * Be aware that not found returns a null.  Other errors (4xx, 5xx) reject the promise
     */
    async getJson(requestUrl, additionalHeaders = {}) {
        additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
        let res = await this.get(requestUrl, additionalHeaders);
        return this._processResponse(res, this.requestOptions);
    }
    async postJson(requestUrl, obj, additionalHeaders = {}) {
        let data = JSON.stringify(obj, null, 2);
        additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
        additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
        let res = await this.post(requestUrl, data, additionalHeaders);
        return this._processResponse(res, this.requestOptions);
    }
    async putJson(requestUrl, obj, additionalHeaders = {}) {
        let data = JSON.stringify(obj, null, 2);
        additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
        additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
        let res = await this.put(requestUrl, data, additionalHeaders);
        return this._processResponse(res, this.requestOptions);
    }
    async patchJson(requestUrl, obj, additionalHeaders = {}) {
        let data = JSON.stringify(obj, null, 2);
        additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
        additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
        let res = await this.patch(requestUrl, data, additionalHeaders);
        return this._processResponse(res, this.requestOptions);
    }
    /**
     * Makes a raw http request.
     * All other methods such as get, post, patch, and request ultimately call this.
     * Prefer get, del, post and patch
     */
    async request(verb, requestUrl, data, headers) {
        if (this._disposed) {
            throw new Error('Client has already been disposed.');
        }
        let parsedUrl = new URL(requestUrl);
        let info = this._prepareRequest(verb, parsedUrl, headers);
        // Only perform retries on reads since writes may not be idempotent.
        let maxTries = this._allowRetries && RetryableHttpVerbs.indexOf(verb) != -1
            ? this._maxRetries + 1
            : 1;
        let numTries = 0;
        let response;
        while (numTries < maxTries) {
            response = await this.requestRaw(info, data);
            // Check if it's an authentication challenge
            if (response &&
                response.message &&
                response.message.statusCode === HttpCodes.Unauthorized) {
                let authenticationHandler;
                for (let i = 0; i < this.handlers.length; i++) {
                    if (this.handlers[i].canHandleAuthentication(response)) {
                        authenticationHandler = this.handlers[i];
                        break;
                    }
                }
                if (authenticationHandler) {
                    return authenticationHandler.handleAuthentication(this, info, data);
                }
                else {
                    // We have received an unauthorized response but have no handlers to handle it.
                    // Let the response return to the caller.
                    return response;
                }
            }
            let redirectsRemaining = this._maxRedirects;
            while (HttpRedirectCodes.indexOf(response.message.statusCode) != -1 &&
                this._allowRedirects &&
                redirectsRemaining > 0) {
                const redirectUrl = response.message.headers['location'];
                if (!redirectUrl) {
                    // if there's no location to redirect to, we won't
                    break;
                }
                let parsedRedirectUrl = new URL(redirectUrl);
                if (parsedUrl.protocol == 'https:' &&
                    parsedUrl.protocol != parsedRedirectUrl.protocol &&
                    !this._allowRedirectDowngrade) {
                    throw new Error('Redirect from HTTPS to HTTP protocol. This downgrade is not allowed for security reasons. If you want to allow this behavior, set the allowRedirectDowngrade option to true.');
                }
                // we need to finish reading the response before reassigning response
                // which will leak the open socket.
                await response.readBody();
                // strip authorization header if redirected to a different hostname
                if (parsedRedirectUrl.hostname !== parsedUrl.hostname) {
                    for (let header in headers) {
                        // header names are case insensitive
                        if (header.toLowerCase() === 'authorization') {
                            delete headers[header];
                        }
                    }
                }
                // let's make the request with the new redirectUrl
                info = this._prepareRequest(verb, parsedRedirectUrl, headers);
                response = await this.requestRaw(info, data);
                redirectsRemaining--;
            }
            if (HttpResponseRetryCodes.indexOf(response.message.statusCode) == -1) {
                // If not a retry code, return immediately instead of retrying
                return response;
            }
            numTries += 1;
            if (numTries < maxTries) {
                await response.readBody();
                await this._performExponentialBackoff(numTries);
            }
        }
        return response;
    }
    /**
     * Needs to be called if keepAlive is set to true in request options.
     */
    dispose() {
        if (this._agent) {
            this._agent.destroy();
        }
        this._disposed = true;
    }
    /**
     * Raw request.
     * @param info
     * @param data
     */
    requestRaw(info, data) {
        return new Promise((resolve, reject) => {
            let callbackForResult = function (err, res) {
                if (err) {
                    reject(err);
                }
                resolve(res);
            };
            this.requestRawWithCallback(info, data, callbackForResult);
        });
    }
    /**
     * Raw request with callback.
     * @param info
     * @param data
     * @param onResult
     */
    requestRawWithCallback(info, data, onResult) {
        let socket;
        if (typeof data === 'string') {
            info.options.headers['Content-Length'] = Buffer.byteLength(data, 'utf8');
        }
        let callbackCalled = false;
        let handleResult = (err, res) => {
            if (!callbackCalled) {
                callbackCalled = true;
                onResult(err, res);
            }
        };
        let req = info.httpModule.request(info.options, (msg) => {
            let res = new HttpClientResponse(msg);
            handleResult(null, res);
        });
        req.on('socket', sock => {
            socket = sock;
        });
        // If we ever get disconnected, we want the socket to timeout eventually
        req.setTimeout(this._socketTimeout || 3 * 60000, () => {
            if (socket) {
                socket.end();
            }
            handleResult(new Error('Request timeout: ' + info.options.path), null);
        });
        req.on('error', function (err) {
            // err has statusCode property
            // res should have headers
            handleResult(err, null);
        });
        if (data && typeof data === 'string') {
            req.write(data, 'utf8');
        }
        if (data && typeof data !== 'string') {
            data.on('close', function () {
                req.end();
            });
            data.pipe(req);
        }
        else {
            req.end();
        }
    }
    /**
     * Gets an http agent. This function is useful when you need an http agent that handles
     * routing through a proxy server - depending upon the url and proxy environment variables.
     * @param serverUrl  The server URL where the request will be sent. For example, https://api.github.com
     */
    getAgent(serverUrl) {
        let parsedUrl = new URL(serverUrl);
        return this._getAgent(parsedUrl);
    }
    _prepareRequest(method, requestUrl, headers) {
        const info = {};
        info.parsedUrl = requestUrl;
        const usingSsl = info.parsedUrl.protocol === 'https:';
        info.httpModule = usingSsl ? https : http;
        const defaultPort = usingSsl ? 443 : 80;
        info.options = {};
        info.options.host = info.parsedUrl.hostname;
        info.options.port = info.parsedUrl.port
            ? parseInt(info.parsedUrl.port)
            : defaultPort;
        info.options.path =
            (info.parsedUrl.pathname || '') + (info.parsedUrl.search || '');
        info.options.method = method;
        info.options.headers = this._mergeHeaders(headers);
        if (this.userAgent != null) {
            info.options.headers['user-agent'] = this.userAgent;
        }
        info.options.agent = this._getAgent(info.parsedUrl);
        // gives handlers an opportunity to participate
        if (this.handlers) {
            this.handlers.forEach(handler => {
                handler.prepareRequest(info.options);
            });
        }
        return info;
    }
    _mergeHeaders(headers) {
        const lowercaseKeys = obj => Object.keys(obj).reduce((c, k) => ((c[k.toLowerCase()] = obj[k]), c), {});
        if (this.requestOptions && this.requestOptions.headers) {
            return Object.assign({}, lowercaseKeys(this.requestOptions.headers), lowercaseKeys(headers));
        }
        return lowercaseKeys(headers || {});
    }
    _getExistingOrDefaultHeader(additionalHeaders, header, _default) {
        const lowercaseKeys = obj => Object.keys(obj).reduce((c, k) => ((c[k.toLowerCase()] = obj[k]), c), {});
        let clientHeader;
        if (this.requestOptions && this.requestOptions.headers) {
            clientHeader = lowercaseKeys(this.requestOptions.headers)[header];
        }
        return additionalHeaders[header] || clientHeader || _default;
    }
    _getAgent(parsedUrl) {
        let agent;
        let proxyUrl = pm.getProxyUrl(parsedUrl);
        let useProxy = proxyUrl && proxyUrl.hostname;
        if (this._keepAlive && useProxy) {
            agent = this._proxyAgent;
        }
        if (this._keepAlive && !useProxy) {
            agent = this._agent;
        }
        // if agent is already assigned use that agent.
        if (!!agent) {
            return agent;
        }
        const usingSsl = parsedUrl.protocol === 'https:';
        let maxSockets = 100;
        if (!!this.requestOptions) {
            maxSockets = this.requestOptions.maxSockets || http.globalAgent.maxSockets;
        }
        if (useProxy) {
            // If using proxy, need tunnel
            if (!tunnel) {
                tunnel = __nccwpck_require__(294);
            }
            const agentOptions = {
                maxSockets: maxSockets,
                keepAlive: this._keepAlive,
                proxy: {
                    ...((proxyUrl.username || proxyUrl.password) && {
                        proxyAuth: `${proxyUrl.username}:${proxyUrl.password}`
                    }),
                    host: proxyUrl.hostname,
                    port: proxyUrl.port
                }
            };
            let tunnelAgent;
            const overHttps = proxyUrl.protocol === 'https:';
            if (usingSsl) {
                tunnelAgent = overHttps ? tunnel.httpsOverHttps : tunnel.httpsOverHttp;
            }
            else {
                tunnelAgent = overHttps ? tunnel.httpOverHttps : tunnel.httpOverHttp;
            }
            agent = tunnelAgent(agentOptions);
            this._proxyAgent = agent;
        }
        // if reusing agent across request and tunneling agent isn't assigned create a new agent
        if (this._keepAlive && !agent) {
            const options = { keepAlive: this._keepAlive, maxSockets: maxSockets };
            agent = usingSsl ? new https.Agent(options) : new http.Agent(options);
            this._agent = agent;
        }
        // if not using private agent and tunnel agent isn't setup then use global agent
        if (!agent) {
            agent = usingSsl ? https.globalAgent : http.globalAgent;
        }
        if (usingSsl && this._ignoreSslError) {
            // we don't want to set NODE_TLS_REJECT_UNAUTHORIZED=0 since that will affect request for entire process
            // http.RequestOptions doesn't expose a way to modify RequestOptions.agent.options
            // we have to cast it to any and change it directly
            agent.options = Object.assign(agent.options || {}, {
                rejectUnauthorized: false
            });
        }
        return agent;
    }
    _performExponentialBackoff(retryNumber) {
        retryNumber = Math.min(ExponentialBackoffCeiling, retryNumber);
        const ms = ExponentialBackoffTimeSlice * Math.pow(2, retryNumber);
        return new Promise(resolve => setTimeout(() => resolve(), ms));
    }
    static dateTimeDeserializer(key, value) {
        if (typeof value === 'string') {
            let a = new Date(value);
            if (!isNaN(a.valueOf())) {
                return a;
            }
        }
        return value;
    }
    async _processResponse(res, options) {
        return new Promise(async (resolve, reject) => {
            const statusCode = res.message.statusCode;
            const response = {
                statusCode: statusCode,
                result: null,
                headers: {}
            };
            // not found leads to null obj returned
            if (statusCode == HttpCodes.NotFound) {
                resolve(response);
            }
            let obj;
            let contents;
            // get the result from the body
            try {
                contents = await res.readBody();
                if (contents && contents.length > 0) {
                    if (options && options.deserializeDates) {
                        obj = JSON.parse(contents, HttpClient.dateTimeDeserializer);
                    }
                    else {
                        obj = JSON.parse(contents);
                    }
                    response.result = obj;
                }
                response.headers = res.message.headers;
            }
            catch (err) {
                // Invalid resource (contents not json);  leaving result obj null
            }
            // note that 3xx redirects are handled by the http layer.
            if (statusCode > 299) {
                let msg;
                // if exception/error in body, attempt to get better error
                if (obj && obj.message) {
                    msg = obj.message;
                }
                else if (contents && contents.length > 0) {
                    // it may be the case that the exception is in the body message as string
                    msg = contents;
                }
                else {
                    msg = 'Failed request: (' + statusCode + ')';
                }
                let err = new HttpClientError(msg, statusCode);
                err.result = response.result;
                reject(err);
            }
            else {
                resolve(response);
            }
        });
    }
}
exports.HttpClient = HttpClient;


/***/ }),

/***/ 443:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function getProxyUrl(reqUrl) {
    let usingSsl = reqUrl.protocol === 'https:';
    let proxyUrl;
    if (checkBypass(reqUrl)) {
        return proxyUrl;
    }
    let proxyVar;
    if (usingSsl) {
        proxyVar = process.env['https_proxy'] || process.env['HTTPS_PROXY'];
    }
    else {
        proxyVar = process.env['http_proxy'] || process.env['HTTP_PROXY'];
    }
    if (proxyVar) {
        proxyUrl = new URL(proxyVar);
    }
    return proxyUrl;
}
exports.getProxyUrl = getProxyUrl;
function checkBypass(reqUrl) {
    if (!reqUrl.hostname) {
        return false;
    }
    let noProxy = process.env['no_proxy'] || process.env['NO_PROXY'] || '';
    if (!noProxy) {
        return false;
    }
    // Determine the request port
    let reqPort;
    if (reqUrl.port) {
        reqPort = Number(reqUrl.port);
    }
    else if (reqUrl.protocol === 'http:') {
        reqPort = 80;
    }
    else if (reqUrl.protocol === 'https:') {
        reqPort = 443;
    }
    // Format the request hostname and hostname with port
    let upperReqHosts = [reqUrl.hostname.toUpperCase()];
    if (typeof reqPort === 'number') {
        upperReqHosts.push(`${upperReqHosts[0]}:${reqPort}`);
    }
    // Compare request host against noproxy
    for (let upperNoProxyItem of noProxy
        .split(',')
        .map(x => x.trim().toUpperCase())
        .filter(x => x)) {
        if (upperReqHosts.some(x => x === upperNoProxyItem)) {
            return true;
        }
    }
    return false;
}
exports.checkBypass = checkBypass;


/***/ }),

/***/ 340:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;

var _manifest = _interopRequireDefault(__nccwpck_require__(4286));

var _request = _interopRequireDefault(__nccwpck_require__(9674));

var _utils = __nccwpck_require__(8826);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @typedef ClientBuilder
 * @param {Object} manifest - manifest definition with at least the `resources` key
 * @param {Function} GatewayClassFactory - factory function that returns a gateway class
 */
function ClientBuilder(manifest, GatewayClassFactory, configs) {
  if (!manifest) {
    throw new Error("[Mappersmith] invalid manifest (".concat(manifest, ")"));
  }

  if (!GatewayClassFactory || !GatewayClassFactory()) {
    throw new Error('[Mappersmith] gateway class not configured (configs.gateway)');
  }

  this.Promise = configs.Promise;
  this.manifest = new _manifest["default"](manifest, configs);
  this.GatewayClassFactory = GatewayClassFactory;
  this.maxMiddlewareStackExecutionAllowed = configs.maxMiddlewareStackExecutionAllowed;
}

ClientBuilder.prototype = {
  build: function build() {
    var _this = this;

    var client = {
      _manifest: this.manifest
    };
    this.manifest.eachResource(function (name, methods) {
      client[name] = _this.buildResource(name, methods);
    });
    return client;
  },
  buildResource: function buildResource(resourceName, methods) {
    var _this2 = this;

    return methods.reduce(function (resource, method) {
      return (0, _utils.assign)(resource, _defineProperty({}, method.name, function (requestParams) {
        var request = new _request["default"](method.descriptor, requestParams);
        return _this2.invokeMiddlewares(resourceName, method.name, request);
      }));
    }, {});
  },
  invokeMiddlewares: function invokeMiddlewares(resourceName, resourceMethod, initialRequest) {
    var _this3 = this;

    var middleware = this.manifest.createMiddleware({
      resourceName: resourceName,
      resourceMethod: resourceMethod
    });
    var GatewayClass = this.GatewayClassFactory();
    var gatewayConfigs = this.manifest.gatewayConfigs;
    var requestPhaseFailureContext = {
      middleware: null,
      returnedInvalidRequest: false,
      abortExecution: false
    };

    var getInitialRequest = function getInitialRequest() {
      return _this3.Promise.resolve(initialRequest);
    };

    var chainRequestPhase = function chainRequestPhase(next, middleware) {
      return function () {
        var abort = function abort(error) {
          requestPhaseFailureContext.abortExecution = true;
          throw error;
        };

        return _this3.Promise.resolve().then(function () {
          return middleware.prepareRequest(next, abort);
        }).then(function (request) {
          if (request instanceof _request["default"]) {
            return request;
          }

          requestPhaseFailureContext.returnedInvalidRequest = true;

          var typeValue = _typeof(request);

          var prettyType = typeValue === 'object' || typeValue === 'function' ? request.name || typeValue : typeValue;
          throw new Error("[Mappersmith] middleware \"".concat(middleware.__name, "\" should return \"Request\" but returned \"").concat(prettyType, "\""));
        })["catch"](function (e) {
          requestPhaseFailureContext.middleware = middleware.__name;
          throw e;
        });
      };
    };

    var prepareRequest = middleware.reduce(chainRequestPhase, getInitialRequest);
    var executions = 0;

    var executeMiddlewareStack = function executeMiddlewareStack() {
      return prepareRequest()["catch"](function (e) {
        var returnedInvalidRequest = requestPhaseFailureContext.returnedInvalidRequest,
            abortExecution = requestPhaseFailureContext.abortExecution,
            middleware = requestPhaseFailureContext.middleware;

        if (returnedInvalidRequest || abortExecution) {
          throw e;
        }

        var error = new Error("[Mappersmith] middleware \"".concat(middleware, "\" failed in the request phase: ").concat(e.message));
        error.stack = e.stack;
        throw error;
      }).then(function (finalRequest) {
        executions++;

        if (executions > _this3.maxMiddlewareStackExecutionAllowed) {
          throw new Error("[Mappersmith] infinite loop detected (middleware stack invoked ".concat(executions, " times). Check the use of \"renew\" in one of the middleware."));
        }

        var renew = executeMiddlewareStack;

        var chainResponsePhase = function chainResponsePhase(next, middleware) {
          return function () {
            return middleware.response(next, renew);
          };
        };

        var callGateway = function callGateway() {
          return new GatewayClass(finalRequest, gatewayConfigs).call();
        };

        var execute = middleware.reduce(chainResponsePhase, callGateway);
        return execute();
      });
    };

    return new this.Promise(function (resolve, reject) {
      executeMiddlewareStack().then(function (response) {
        return resolve(response);
      })["catch"](reject);
    });
  }
};
var _default = ClientBuilder;
exports["default"] = _default;

/***/ }),

/***/ 6616:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;

var _utils = __nccwpck_require__(8826);

var _mappersmith = __nccwpck_require__(2378);

var _response = _interopRequireDefault(__nccwpck_require__(4660));

var _timeoutError = __nccwpck_require__(4752);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var REGEXP_EMULATE_HTTP = /^(delete|put|patch)/i;

function Gateway(request) {
  var configs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  this.request = request;
  this.configs = configs;

  this.successCallback = function () {};

  this.failCallback = function () {};
}

Gateway["extends"] = function (methods) {
  return (0, _utils.assign)({}, Gateway.prototype, methods);
};

Gateway.prototype = {
  options: function options() {
    return this.configs;
  },
  shouldEmulateHTTP: function shouldEmulateHTTP() {
    return this.options().emulateHTTP && REGEXP_EMULATE_HTTP.test(this.request.method());
  },
  call: function call() {
    var _arguments = arguments,
        _this = this;

    var timeStart = (0, _utils.performanceNow)();
    return new _mappersmith.configs.Promise(function (resolve, reject) {
      _this.successCallback = function (response) {
        response.timeElapsed = (0, _utils.performanceNow)() - timeStart;
        resolve(response);
      };

      _this.failCallback = function (response) {
        response.timeElapsed = (0, _utils.performanceNow)() - timeStart;
        reject(response);
      };

      try {
        _this[_this.request.method()].apply(_this, _arguments);
      } catch (e) {
        _this.dispatchClientError(e.message, e);
      }
    });
  },
  dispatchResponse: function dispatchResponse(response) {
    response.success() ? this.successCallback(response) : this.failCallback(response);
  },
  dispatchClientError: function dispatchClientError(message, error) {
    if ((0, _timeoutError.isTimeoutError)(error) && this.options().enableHTTP408OnTimeouts) {
      this.failCallback(new _response["default"](this.request, 408, message, {}, [error]));
    } else {
      this.failCallback(new _response["default"](this.request, 400, message, {}, [error]));
    }
  },
  prepareBody: function prepareBody(method, headers) {
    var body = this.request.body();

    if (this.shouldEmulateHTTP()) {
      body = body || {};
      (0, _utils.isPlainObject)(body) && (body._method = method);
      headers['x-http-method-override'] = method;
    }

    var bodyString = (0, _utils.toQueryString)(body);

    if (bodyString) {
      // If it's not simple, let the browser (or the user) set it
      if ((0, _utils.isPlainObject)(body)) {
        headers['content-type'] = 'application/x-www-form-urlencoded;charset=utf-8';
      }
    }

    return bodyString;
  }
};
var _default = Gateway;
exports["default"] = _default;

/***/ }),

/***/ 951:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";
var __webpack_unused_export__;


__webpack_unused_export__ = ({
  value: true
});
exports.Z = void 0;

var _url = _interopRequireDefault(__nccwpck_require__(310));

var _http = _interopRequireDefault(__nccwpck_require__(685));

var _https = _interopRequireDefault(__nccwpck_require__(687));

var _utils = __nccwpck_require__(8826);

var _gateway = _interopRequireDefault(__nccwpck_require__(6616));

var _response = _interopRequireDefault(__nccwpck_require__(4660));

var _timeoutError = __nccwpck_require__(4752);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function HTTP(request) {
  _gateway["default"].apply(this, arguments);
}

HTTP.prototype = _gateway["default"]["extends"]({
  get: function get() {
    this.performRequest('get');
  },
  head: function head() {
    this.performRequest('head');
  },
  post: function post() {
    this.performRequest('post');
  },
  put: function put() {
    this.performRequest('put');
  },
  patch: function patch() {
    this.performRequest('patch');
  },
  "delete": function _delete() {
    this.performRequest('delete');
  },
  performRequest: function performRequest(method) {
    var _this = this;

    var headers = {}; // eslint-disable-next-line node/no-deprecated-api

    var defaults = _url["default"].parse(this.request.url());

    var requestMethod = this.shouldEmulateHTTP() ? 'post' : method;
    var body = this.prepareBody(method, headers);
    var timeout = this.request.timeout();
    this.canceled = false;

    if (body && typeof body.length === 'number') {
      headers['content-length'] = Buffer.byteLength(body);
    }

    var handler = defaults.protocol === 'https:' ? _https["default"] : _http["default"];
    var requestParams = (0, _utils.assign)(defaults, {
      method: requestMethod,
      headers: (0, _utils.assign)(headers, this.request.headers())
    });
    var auth = this.request.auth();

    if (auth) {
      var username = auth.username || '';
      var password = auth.password || '';
      requestParams['auth'] = "".concat(username, ":").concat(password);
    }

    var httpOptions = this.options().HTTP;

    if (httpOptions.useSocketConnectionTimeout) {
      requestParams['timeout'] = timeout;
    }

    if (httpOptions.configure) {
      (0, _utils.assign)(requestParams, httpOptions.configure(requestParams));
    }

    if (httpOptions.onRequestWillStart) {
      httpOptions.onRequestWillStart(requestParams);
    }

    var httpRequest = handler.request(requestParams, function (httpResponse) {
      return _this.onResponse(httpResponse, httpOptions, requestParams);
    });
    httpRequest.on('socket', function (socket) {
      if (httpOptions.onRequestSocketAssigned) {
        httpOptions.onRequestSocketAssigned(requestParams);
      }

      socket.on('lookup', function () {
        if (httpOptions.onSocketLookup) {
          httpOptions.onSocketLookup(requestParams);
        }
      });
      socket.on('connect', function () {
        if (httpOptions.onSocketConnect) {
          httpOptions.onSocketConnect(requestParams);
        }
      });
      socket.on('secureConnect', function () {
        if (httpOptions.onSocketSecureConnect) {
          httpOptions.onSocketSecureConnect(requestParams);
        }
      });
    });
    httpRequest.on('error', function (e) {
      return _this.onError(e);
    });
    body && httpRequest.write(body);

    if (timeout) {
      if (!httpOptions.useSocketConnectionTimeout) {
        httpRequest.setTimeout(timeout);
      }

      httpRequest.on('timeout', function () {
        _this.canceled = true;
        httpRequest.abort();
        var error = (0, _timeoutError.createTimeoutError)("Timeout (".concat(timeout, "ms)"));

        _this.dispatchClientError(error.message, error);
      });
    }

    httpRequest.end();
  },
  onResponse: function onResponse(httpResponse, httpOptions, requestParams) {
    var _this2 = this;

    var rawData = [];

    if (!this.request.isBinary()) {
      httpResponse.setEncoding('utf8');
    }

    httpResponse.once('readable', function () {
      if (httpOptions.onResponseReadable) {
        httpOptions.onResponseReadable(requestParams);
      }
    });
    httpResponse.on('data', function (chunk) {
      return rawData.push(chunk);
    }).on('end', function () {
      if (_this2.canceled) {
        return;
      }

      _this2.dispatchResponse(_this2.createResponse(httpResponse, rawData));
    });
    httpResponse.on('end', function () {
      if (httpOptions.onResponseEnd) {
        httpOptions.onResponseEnd(requestParams);
      }
    });
  },
  onError: function onError(e) {
    if (this.canceled) {
      return;
    }

    this.dispatchClientError(e.message, e);
  },
  createResponse: function createResponse(httpResponse, rawData) {
    return new _response["default"](this.request, httpResponse.statusCode, this.request.isBinary() ? Buffer.concat(rawData) : rawData.join(''), httpResponse.headers);
  }
});
var _default = HTTP;
exports.Z = _default;

/***/ }),

/***/ 4752:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.createTimeoutError = exports.isTimeoutError = void 0;

var isTimeoutError = function isTimeoutError(e) {
  return e && e.name === 'TimeoutError';
};

exports.isTimeoutError = isTimeoutError;

var createTimeoutError = function createTimeoutError(message) {
  var error = new Error(message);
  error.name = 'TimeoutError';
  return error;
};

exports.createTimeoutError = createTimeoutError;

/***/ }),

/***/ 9518:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";
var __webpack_unused_export__;


__webpack_unused_export__ = ({
  value: true
});
exports.Z = void 0;

var _gateway = _interopRequireDefault(__nccwpck_require__(6616));

var _response = _interopRequireDefault(__nccwpck_require__(4660));

var _utils = __nccwpck_require__(8826);

var _timeoutError = __nccwpck_require__(4752);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var toBase64 = window.btoa || _utils.btoa;

function XHR(request) {
  _gateway["default"].apply(this, arguments);
}

XHR.prototype = _gateway["default"]["extends"]({
  get: function get() {
    var xmlHttpRequest = this.createXHR();
    xmlHttpRequest.open('GET', this.request.url(), true);
    this.setHeaders(xmlHttpRequest, {});
    this.configureTimeout(xmlHttpRequest);
    this.configureBinary(xmlHttpRequest);
    xmlHttpRequest.send();
  },
  head: function head() {
    var xmlHttpRequest = this.createXHR();
    xmlHttpRequest.open('HEAD', this.request.url(), true);
    this.setHeaders(xmlHttpRequest, {});
    this.configureTimeout(xmlHttpRequest);
    this.configureBinary(xmlHttpRequest);
    xmlHttpRequest.send();
  },
  post: function post() {
    this.performRequest('post');
  },
  put: function put() {
    this.performRequest('put');
  },
  patch: function patch() {
    this.performRequest('patch');
  },
  "delete": function _delete() {
    this.performRequest('delete');
  },
  configureBinary: function configureBinary(xmlHttpRequest) {
    if (this.request.isBinary()) {
      xmlHttpRequest.responseType = 'blob';
    }
  },
  configureTimeout: function configureTimeout(xmlHttpRequest) {
    var _this = this;

    this.canceled = false;
    this.timer = null;
    var timeout = this.request.timeout();

    if (timeout) {
      xmlHttpRequest.timeout = timeout;
      xmlHttpRequest.addEventListener('timeout', function () {
        _this.canceled = true;
        clearTimeout(_this.timer);
        var error = (0, _timeoutError.createTimeoutError)("Timeout (".concat(timeout, "ms)"));

        _this.dispatchClientError(error.message, error);
      }); // PhantomJS doesn't support timeout for XMLHttpRequest

      this.timer = setTimeout(function () {
        _this.canceled = true;
        var error = (0, _timeoutError.createTimeoutError)("Timeout (".concat(timeout, "ms)"));

        _this.dispatchClientError(error.message, error);
      }, timeout + 1);
    }
  },
  configureCallbacks: function configureCallbacks(xmlHttpRequest) {
    var _this2 = this;

    xmlHttpRequest.addEventListener('load', function () {
      if (_this2.canceled) {
        return;
      }

      clearTimeout(_this2.timer);

      _this2.dispatchResponse(_this2.createResponse(xmlHttpRequest));
    });
    xmlHttpRequest.addEventListener('error', function (e) {
      if (_this2.canceled) {
        return;
      }

      clearTimeout(_this2.timer);
      var guessedErrorCause = e ? e.message || e.name : xmlHttpRequest.responseText;
      var errorMessage = 'Network error';
      var enhancedMessage = guessedErrorCause ? ": ".concat(guessedErrorCause) : '';
      var error = new Error("".concat(errorMessage).concat(enhancedMessage));

      _this2.dispatchClientError(errorMessage, error);
    });
    var xhrOptions = this.options().XHR;

    if (xhrOptions.withCredentials) {
      xmlHttpRequest.withCredentials = true;
    }

    if (xhrOptions.configure) {
      xhrOptions.configure(xmlHttpRequest);
    }
  },
  performRequest: function performRequest(method) {
    var requestMethod = this.shouldEmulateHTTP() ? 'post' : method;
    var xmlHttpRequest = this.createXHR();
    xmlHttpRequest.open(requestMethod.toUpperCase(), this.request.url(), true);
    var customHeaders = {};
    var body = this.prepareBody(method, customHeaders);
    this.setHeaders(xmlHttpRequest, customHeaders);
    this.configureTimeout(xmlHttpRequest);
    this.configureBinary(xmlHttpRequest);
    var args = [];
    body && args.push(body);
    xmlHttpRequest.send.apply(xmlHttpRequest, args);
  },
  createResponse: function createResponse(xmlHttpRequest) {
    var status = xmlHttpRequest.status;
    var data = this.request.isBinary() ? xmlHttpRequest.response : xmlHttpRequest.responseText;
    var responseHeaders = (0, _utils.parseResponseHeaders)(xmlHttpRequest.getAllResponseHeaders());
    return new _response["default"](this.request, status, data, responseHeaders);
  },
  setHeaders: function setHeaders(xmlHttpRequest, customHeaders) {
    var auth = this.request.auth();

    if (auth) {
      var username = auth.username || '';
      var password = auth.password || '';
      customHeaders['authorization'] = "Basic ".concat(toBase64("".concat(username, ":").concat(password)));
    }

    var headers = (0, _utils.assign)(customHeaders, this.request.headers());
    Object.keys(headers).forEach(function (headerName) {
      xmlHttpRequest.setRequestHeader(headerName, headers[headerName]);
    });
  },
  createXHR: function createXHR() {
    var xmlHttpRequest = new XMLHttpRequest(); // eslint-disable-line no-undef

    this.configureCallbacks(xmlHttpRequest);
    return xmlHttpRequest;
  }
});
var _default = XHR;
exports.Z = _default;

/***/ }),

/***/ 6250:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


var lib = __nccwpck_require__(2378);

var _process, defaultGateway; // Prevents webpack to load the nodejs processs polyfill


try {
  _process = eval('typeof process === "object" ? process : undefined');
} catch (e) {} // eslint-disable-line no-eval


if (typeof XMLHttpRequest !== 'undefined') {
  // For browsers use XHR adapter
  defaultGateway = (__nccwpck_require__(518)/* ["default"] */ .Z);
} else if (typeof _process !== 'undefined') {
  // For node use HTTP adapter
  defaultGateway = (__nccwpck_require__(951)/* ["default"] */ .Z);
}

lib.configs.gateway = defaultGateway;
module.exports = lib;

/***/ }),

/***/ 4286:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;

var _methodDescriptor = _interopRequireDefault(__nccwpck_require__(1856));

var _utils = __nccwpck_require__(8826);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/**
 * @typedef Manifest
 * @param {Object} obj
 *   @param {String} obj.host
 *   @param {boolean} obj.allowResourceHostOverride - default: false
 *   @param {Object} obj.gatewayConfigs - default: base values from mappersmith
 *   @param {Object} obj.ignoreGlobalMiddleware - default: false
 *   @param {Object} obj.resources - default: {}
 *   @param {Array}  obj.middleware or obj.middlewares - default: []
 * @param {Object} globalConfigs
 */
function Manifest(obj, _ref) {
  var _ref$gatewayConfigs = _ref.gatewayConfigs,
      gatewayConfigs = _ref$gatewayConfigs === void 0 ? null : _ref$gatewayConfigs,
      _ref$middleware = _ref.middleware,
      middleware = _ref$middleware === void 0 ? [] : _ref$middleware,
      _ref$context = _ref.context,
      context = _ref$context === void 0 ? {} : _ref$context;
  this.host = obj.host;
  this.allowResourceHostOverride = obj.allowResourceHostOverride || false;
  this.bodyAttr = obj.bodyAttr;
  this.headersAttr = obj.headersAttr;
  this.authAttr = obj.authAttr;
  this.timeoutAttr = obj.timeoutAttr;
  this.hostAttr = obj.hostAttr;
  this.clientId = obj.clientId || null;
  this.gatewayConfigs = (0, _utils.assign)({}, gatewayConfigs, obj.gatewayConfigs);
  this.resources = obj.resources || {};
  this.context = context;
  var clientMiddleware = obj.middleware || obj.middlewares || []; // TODO: deprecate obj.middlewares in favor of obj.middleware

  if (obj.ignoreGlobalMiddleware) {
    this.middleware = clientMiddleware;
  } else {
    this.middleware = [].concat(_toConsumableArray(clientMiddleware), _toConsumableArray(middleware));
  }
}

Manifest.prototype = {
  eachResource: function eachResource(callback) {
    var _this = this;

    Object.keys(this.resources).forEach(function (resourceName) {
      var methods = _this.eachMethod(resourceName, function (methodName) {
        return {
          name: methodName,
          descriptor: _this.createMethodDescriptor(resourceName, methodName)
        };
      });

      callback(resourceName, methods);
    });
  },
  eachMethod: function eachMethod(resourceName, callback) {
    return Object.keys(this.resources[resourceName]).map(callback);
  },
  createMethodDescriptor: function createMethodDescriptor(resourceName, methodName) {
    var definition = this.resources[resourceName][methodName];

    if (!definition || !definition.path) {
      throw new Error("[Mappersmith] path is undefined for resource \"".concat(resourceName, "\" method \"").concat(methodName, "\""));
    }

    return new _methodDescriptor["default"]((0, _utils.assign)({
      host: this.host,
      allowResourceHostOverride: this.allowResourceHostOverride,
      bodyAttr: this.bodyAttr,
      headersAttr: this.headersAttr,
      authAttr: this.authAttr,
      timeoutAttr: this.timeoutAttr,
      hostAttr: this.hostAttr
    }, definition));
  },

  /**
   * @param {Object} args
   *   @param {String|Null} args.clientId
   *   @param {String} args.resourceName
   *   @param {String} args.resourceMethod
   *   @param {Object} args.context
   *   @param {Boolean} args.mockRequest
   *
   * @return {Array<Object>}
   */
  createMiddleware: function createMiddleware() {
    var _this2 = this;

    var args = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var createInstance = function createInstance(middlewareFactory) {
      return (0, _utils.assign)({
        __name: middlewareFactory.name || middlewareFactory.toString(),
        response: function response(next) {
          return next();
        },

        /**
         * @since 2.27.0
         * Replaced the request method
         */
        prepareRequest: function prepareRequest(next) {
          var _this3 = this;

          return this.request ? next().then(function (req) {
            return _this3.request(req);
          }) : next();
        }
      }, middlewareFactory((0, _utils.assign)(args, {
        clientId: _this2.clientId,
        context: (0, _utils.assign)({}, _this2.context)
      })));
    };

    var name = args.resourceName,
        method = args.resourceMethod;
    var resourceMiddleware = this.createMethodDescriptor(name, method).middleware;
    var middlewares = [].concat(_toConsumableArray(resourceMiddleware), _toConsumableArray(this.middleware));
    return middlewares.map(createInstance);
  }
};
var _default = Manifest;
exports["default"] = _default;

/***/ }),

/***/ 2378:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = forge;
exports.setContext = exports.configs = exports.version = void 0;

var _clientBuilder = _interopRequireDefault(__nccwpck_require__(8340));

var _utils = __nccwpck_require__(8826);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/* global VERSION */
var version = "2.35.0";
exports.version = version;
var configs = {
  context: {},
  middleware: [],
  Promise: typeof Promise === 'function' ? Promise : null,
  fetch: typeof fetch === 'function' ? fetch : null,
  // eslint-disable-line no-undef

  /**
   * The maximum amount of executions allowed before it is considered an infinite loop.
   * In the response phase of middleware, it's possible to execute a function called "renew",
   * which can be used to rerun the middleware stack. This feature is useful in some scenarios,
   * for example, re-fetching an invalid access token.
    * This configuration is used to detect infinite loops, don't increase this value too much
   * @default 2
   */
  maxMiddlewareStackExecutionAllowed: 2,

  /**
   * Gateway implementation, it defaults to "lib/gateway/xhr" for browsers and
   * "lib/gateway/http" for node
   */
  gateway: null,
  gatewayConfigs: {
    /**
     * Setting this option will fake PUT, PATCH and DELETE requests with a HTTP POST. It will
     * add "_method" and "X-HTTP-Method-Override" with the original requested method
     * @default false
     */
    emulateHTTP: false,

    /**
     * Setting this option will return HTTP status 408 (Request Timeout) when a request times
     * out. When "false", HTTP status 400 (Bad Request) will be used instead.
     * @default false
     */
    enableHTTP408OnTimeouts: false,
    XHR: {
      /**
       * Indicates whether or not cross-site Access-Control requests should be made using credentials
       * such as cookies, authorization headers or TLS client certificates.
       * Setting withCredentials has no effect on same-site requests
       *
       * https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials
       *
       * @default false
       */
      withCredentials: false,

      /**
       * For additional configurations to the XMLHttpRequest object.
       * @param {XMLHttpRequest} xhr
       * @default null
       */
      configure: null
    },
    HTTP: {
      /**
       * Enable this option to evaluate timeout on entire request durations,
       * including DNS resolution and socket connection.
       *
       * See original nodejs issue: https://github.com/nodejs/node/pull/8101
       *
       * @default false
       */
      useSocketConnectionTimeout: false,

      /**
       * For additional configurations to the http/https module
       * For http: https://nodejs.org/api/http.html#http_http_request_options_callback
       * For https: https://nodejs.org/api/https.html#https_https_request_options_callback
       *
       * @param {object} options
       * @default null
       */
      configure: null,
      onRequestWillStart: null,
      onRequestSocketAssigned: null,
      onSocketLookup: null,
      onSocketConnect: null,
      onSocketSecureConnect: null,
      onResponseReadable: null,
      onResponseEnd: null
    },
    Fetch: {
      /**
       * Indicates whether the user agent should send cookies from the other domain in the case of cross-origin
       * requests. This is similar to XHR’s withCredentials flag, but with three available values (instead of two):
       *
       * "omit": Never send cookies.
       * "same-origin": Only send cookies if the URL is on the same origin as the calling script.
       * "include": Always send cookies, even for cross-origin calls.
       *
       * https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials
       *
       * @default "omit"
       */
      credentials: 'omit'
    }
  }
};
/**
 * @deprecated Shouldn't be used, not safe for concurrent use.
 * @param {Object} context
 */

exports.configs = configs;

var setContext = function setContext(context) {
  console.warn('The use of setContext is deprecated - you need to find another way to pass data between your middlewares.');
  configs.context = (0, _utils.assign)(configs.context, context);
};
/**
 * @param {Object} manifest
 */


exports.setContext = setContext;

function forge(manifest) {
  var GatewayClassFactory = function GatewayClassFactory() {
    return configs.gateway;
  };

  return new _clientBuilder["default"](manifest, GatewayClassFactory, configs).build();
}

/***/ }),

/***/ 1856:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = MethodDescriptor;

/**
 * @typedef MethodDescriptor
 * @param {Object} obj
 *   @param {String} obj.host
 *   @param {boolean} obj.allowResourceHostOverride
 *   @param {String|Function} obj.path
 *   @param {String} obj.method
 *   @param {Object} obj.headers
 *   @param {Object} obj.params
 *   @param {Object} obj.queryParamAlias
 *   @param {String} obj.bodyAttr - body attribute name. Default: 'body'
 *   @param {String} obj.headersAttr - headers attribute name. Default: 'headers'
 *   @param {String} obj.authAttr - auth attribute name. Default: 'auth'
 *   @param {Number} obj.timeoutAttr - timeout attribute name. Default: 'timeout'
 *   @param {String} obj.hostAttr - host attribute name. Default: 'host'
 */
function MethodDescriptor(obj) {
  this.host = obj.host;
  this.allowResourceHostOverride = obj.allowResourceHostOverride || false;
  this.path = obj.path;
  this.method = obj.method || 'get';
  this.headers = obj.headers;
  this.params = obj.params;
  this.queryParamAlias = obj.queryParamAlias || {};
  this.binary = obj.binary || false;
  this.bodyAttr = obj.bodyAttr || 'body';
  this.headersAttr = obj.headersAttr || 'headers';
  this.authAttr = obj.authAttr || 'auth';
  this.timeoutAttr = obj.timeoutAttr || 'timeout';
  this.hostAttr = obj.hostAttr || 'host';
  var resourceMiddleware = obj.middleware || obj.middlewares || [];
  this.middleware = resourceMiddleware;
}

/***/ }),

/***/ 2272:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = exports.CONTENT_TYPE_JSON = void 0;
var mediaType = 'application/json';
var charset = 'charset=utf-8';
var CONTENT_TYPE_JSON = "".concat(mediaType, ";").concat(charset);
exports.CONTENT_TYPE_JSON = CONTENT_TYPE_JSON;

var isJson = function isJson(contentType) {
  return contentType === mediaType || contentType.startsWith("".concat(mediaType, ";"));
};

var alreadyEncoded = function alreadyEncoded(body) {
  return typeof body === 'string';
};
/**
 * Automatically encode your objects into JSON
 *
 * Example:
 * client.User.all({ body: { name: 'bob' } })
 * // => body: {"name":"bob"}
 * // => header: "Content-Type=application/json;charset=utf-8"
 */


var EncodeJsonMiddleware = function EncodeJsonMiddleware() {
  return {
    prepareRequest: function prepareRequest(next) {
      return next().then(function (request) {
        try {
          var body = request.body();
          var contentType = request.header('content-type');

          if (body) {
            var shouldEncodeBody = contentType == null || isJson(contentType) && !alreadyEncoded(body);
            var encodedBody = shouldEncodeBody ? JSON.stringify(body) : body;
            return request.enhance({
              headers: {
                'content-type': contentType == null ? CONTENT_TYPE_JSON : contentType
              },
              body: encodedBody
            });
          }
        } catch (e) {}

        return request;
      });
    }
  };
};

var _default = EncodeJsonMiddleware;
exports["default"] = _default;

/***/ }),

/***/ 9674:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;

var _utils = __nccwpck_require__(8826);

var REGEXP_DYNAMIC_SEGMENT = /{([^}?]+)\??}/;
var REGEXP_OPTIONAL_DYNAMIC_SEGMENT = /\/?{([^}?]+)\?}/g;
var REGEXP_TRAILING_SLASH = /\/$/;
/**
 * @typedef Request
 * @param {MethodDescriptor} methodDescriptor
 * @param {Object} requestParams, defaults to an empty object ({})
 */

function Request(methodDescriptor, requestParams) {
  this.methodDescriptor = methodDescriptor;
  this.requestParams = requestParams || {};
}

Request.prototype = {
  /**
   * @return {Object}
   */
  params: function params() {
    var _this = this;

    var params = (0, _utils.assign)({}, this.methodDescriptor.params, this.requestParams);

    var isParam = function isParam(key) {
      return key !== _this.methodDescriptor.headersAttr && key !== _this.methodDescriptor.bodyAttr && key !== _this.methodDescriptor.authAttr && key !== _this.methodDescriptor.timeoutAttr && key !== _this.methodDescriptor.hostAttr;
    };

    return Object.keys(params).reduce(function (obj, key) {
      if (isParam(key)) {
        obj[key] = params[key];
      }

      return obj;
    }, {});
  },

  /**
   * Returns the HTTP method in lowercase
   *
   * @return {String}
   */
  method: function method() {
    return this.methodDescriptor.method.toLowerCase();
  },

  /**
   * Returns host name without trailing slash
   * Example: http://example.org
   *
   * @return {String}
   */
  host: function host() {
    var _this$methodDescripto = this.methodDescriptor,
        allowResourceHostOverride = _this$methodDescripto.allowResourceHostOverride,
        hostAttr = _this$methodDescripto.hostAttr,
        host = _this$methodDescripto.host;
    var originalHost = allowResourceHostOverride ? this.requestParams[hostAttr] || host || '' : host || '';
    return originalHost.replace(REGEXP_TRAILING_SLASH, '');
  },

  /**
   * Returns path with parameters and leading slash.
   * Example: /some/path?param1=true
   *
   * @throws {Error} if any dynamic segment is missing.
   * Example:
   * Imagine the path '/some/{name}', the error will be similar to:
   * '[Mappersmith] required parameter missing (name), "/some/{name}" cannot be resolved'
   *
   * @return {String}
   */
  path: function path() {
    var _this2 = this;

    var params = this.params();
    var path;

    if (typeof this.methodDescriptor.path === 'function') {
      path = this.methodDescriptor.path(params);
    } else {
      path = this.methodDescriptor.path;
    }

    if (path[0] !== '/') {
      path = "/".concat(path);
    } // RegExp with 'g'-flag is stateful, therefore defining it locally


    var regexp = new RegExp(REGEXP_DYNAMIC_SEGMENT, 'g');
    var dynamicSegmentKeys = [];
    var match;

    while ((match = regexp.exec(path)) !== null) {
      dynamicSegmentKeys.push(match[1]);
    }

    for (var _i = 0, _dynamicSegmentKeys = dynamicSegmentKeys; _i < _dynamicSegmentKeys.length; _i++) {
      var key = _dynamicSegmentKeys[_i];
      var pattern = new RegExp("{".concat(key, "\\??}"), 'g');

      if (params[key] != null) {
        path = path.replace(pattern, encodeURIComponent(params[key]));
        delete params[key];
      }
    }

    path = path.replace(REGEXP_OPTIONAL_DYNAMIC_SEGMENT, '');
    var missingDynamicSegmentMatch = path.match(REGEXP_DYNAMIC_SEGMENT);

    if (missingDynamicSegmentMatch) {
      throw new Error("[Mappersmith] required parameter missing (".concat(missingDynamicSegmentMatch[1], "), \"").concat(path, "\" cannot be resolved"));
    }

    var aliasedParams = Object.keys(params).reduce(function (aliased, key) {
      var aliasedKey = _this2.methodDescriptor.queryParamAlias[key] || key;
      aliased[aliasedKey] = params[key];
      return aliased;
    }, {});
    var queryString = (0, _utils.toQueryString)(aliasedParams);

    if (queryString.length !== 0) {
      var hasQuery = path.includes('?');
      path += "".concat(hasQuery ? '&' : '?').concat(queryString);
    }

    return path;
  },

  /**
   * Returns the template path, without params, before interpolation.
   * If path is a function, returns the result of request.path()
   * Example: /some/{param}/path
   *
   * @return {String|Function}
   */
  pathTemplate: function pathTemplate() {
    var path = this.methodDescriptor.path;

    if (typeof this.methodDescriptor.path !== 'function' && path[0] !== '/') {
      path = "/".concat(path);
    }

    return path;
  },

  /**
   * Returns the full URL
   * Example: http://example.org/some/path?param1=true
   *
   * @return {String}
   */
  url: function url() {
    return "".concat(this.host()).concat(this.path());
  },

  /**
   * Returns an object with the headers. Header names are converted to
   * lowercase
   *
   * @return {Object}
   */
  headers: function headers() {
    return (0, _utils.lowerCaseObjectKeys)((0, _utils.assign)({}, this.methodDescriptor.headers, this.requestParams[this.methodDescriptor.headersAttr]));
  },

  /**
   * Utility method to get a header value by name
   *
   * @param {String} name
   *
   * @return {String|Undefined}
   */
  header: function header(name) {
    return this.headers()[name.toLowerCase()];
  },
  body: function body() {
    return this.requestParams[this.methodDescriptor.bodyAttr];
  },
  auth: function auth() {
    return this.requestParams[this.methodDescriptor.authAttr];
  },
  timeout: function timeout() {
    return this.requestParams[this.methodDescriptor.timeoutAttr];
  },

  /**
   * Enhances current request returning a new Request
   * @param {Object} extras
   *   @param {Object} extras.params - it will be merged with current params
   *   @param {Object} extras.headers - it will be merged with current headers
   *   @param {String|Object} extras.body - it will replace the current body
   *   @param {Object} extras.auth - it will replace the current auth
   *   @param {Number} extras.timeout - it will replace the current timeout
   *   @param {String} extras.host - it will replace the current timeout
   */
  enhance: function enhance(extras) {
    var headerKey = this.methodDescriptor.headersAttr;
    var bodyKey = this.methodDescriptor.bodyAttr;
    var authKey = this.methodDescriptor.authAttr;
    var timeoutKey = this.methodDescriptor.timeoutAttr;
    var hostKey = this.methodDescriptor.hostAttr;
    var requestParams = (0, _utils.assign)({}, this.requestParams, extras.params);
    requestParams[headerKey] = (0, _utils.assign)({}, this.requestParams[headerKey], extras.headers);
    extras.body && (requestParams[bodyKey] = extras.body);
    extras.auth && (requestParams[authKey] = extras.auth);
    extras.timeout && (requestParams[timeoutKey] = extras.timeout);
    extras.host && (requestParams[hostKey] = extras.host);
    return new Request(this.methodDescriptor, requestParams);
  },

  /**
   * Is the request expecting a binary response?
   *
   * @return {Boolean}
   */
  isBinary: function isBinary() {
    return this.methodDescriptor.binary;
  }
};
var _default = Request;
exports["default"] = _default;

/***/ }),

/***/ 4660:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;

var _utils = __nccwpck_require__(8826);

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var REGEXP_CONTENT_TYPE_JSON = /^application\/(json|.*\+json)/;
/**
 * @typedef Response
 * @param {Request} originalRequest, for auth it hides the password
 * @param {Integer} responseStatus
 * @param {String} responseData, defaults to null
 * @param {Object} responseHeaders, defaults to an empty object ({})
 * @param {Array<Error>} errors, defaults to an empty array ([])
 */

function Response(originalRequest, responseStatus, responseData, responseHeaders, errors) {
  if (originalRequest.requestParams && originalRequest.requestParams.auth) {
    var maskedAuth = (0, _utils.assign)({}, originalRequest.requestParams.auth, {
      password: '***'
    });
    this.originalRequest = originalRequest.enhance({
      auth: maskedAuth
    });
  } else {
    this.originalRequest = originalRequest;
  }

  this.responseStatus = responseStatus;
  this.responseData = responseData !== undefined ? responseData : null;
  this.responseHeaders = responseHeaders || {};
  this.errors = errors || [];
  this.timeElapsed = null;
}

Response.prototype = {
  /**
   * @return {Request}
   */
  request: function request() {
    return this.originalRequest;
  },

  /**
   * @return {Integer}
   */
  status: function status() {
    // IE sends 1223 instead of 204
    if (this.responseStatus === 1223) {
      return 204;
    }

    return this.responseStatus;
  },

  /**
   * Returns true if status is greater or equal 200 or lower than 400
   *
   * @return {Boolean}
   */
  success: function success() {
    var status = this.status();
    return status >= 200 && status < 400;
  },

  /**
   * Returns an object with the headers. Header names are converted to
   * lowercase
   *
   * @return {Object}
   */
  headers: function headers() {
    return (0, _utils.lowerCaseObjectKeys)(this.responseHeaders);
  },

  /**
   * Utility method to get a header value by name
   *
   * @param {String} name
   *
   * @return {String|Undefined}
   */
  header: function header(name) {
    return this.headers()[name.toLowerCase()];
  },

  /**
   * Returns the original response data
   */
  rawData: function rawData() {
    return this.responseData;
  },

  /**
   * Returns the response data, if "Content-Type" is "application/json"
   * it parses the response and returns an object
   *
   * @return {String|Object}
   */
  data: function data() {
    var data = this.responseData;

    if (this.isContentTypeJSON()) {
      try {
        data = JSON.parse(this.responseData);
      } catch (e) {}
    }

    return data;
  },
  isContentTypeJSON: function isContentTypeJSON() {
    return REGEXP_CONTENT_TYPE_JSON.test(this.headers()['content-type']);
  },

  /**
   * Returns the last error instance that caused the request to fail
   *
   * @return {Error|null}
   */
  error: function error() {
    var lastError = this.errors[this.errors.length - 1] || null;

    if (typeof lastError === 'string') {
      return new Error(lastError);
    }

    return lastError;
  },

  /**
   * Enhances current Response returning a new Response
   *
   * @param {Object} extras
   *   @param {Integer} extras.status - it will replace the current status
   *   @param {String} extras.rawData - it will replace the current rawData
   *   @param {Object} extras.headers - it will be merged with current headers
   *   @param {Error} extras.error    - it will be added to the list of errors
   *
   * @return {Response}
   */
  enhance: function enhance(extras) {
    var enhancedResponse = new Response(this.request(), extras.status || this.status(), extras.rawData || this.rawData(), (0, _utils.assign)({}, this.headers(), extras.headers), extras.error ? [].concat(_toConsumableArray(this.errors), [extras.error]) : _toConsumableArray(this.errors));
    enhancedResponse.timeElapsed = this.timeElapsed;
    return enhancedResponse;
  }
};
var _default = Response;
exports["default"] = _default;

/***/ }),

/***/ 8826:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.btoa = exports.isPlainObject = exports.assign = exports.lowerCaseObjectKeys = exports.parseResponseHeaders = exports.performanceNow = exports.toQueryString = exports.buildRecursive = exports.validKeys = void 0;

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _process, getNanoSeconds, loadTime;

try {
  _process = eval('typeof __TEST_WEB__ === "undefined" && typeof process === "object" ? process : undefined');
} catch (e) {} // eslint-disable-line no-eval


var hasProcessHrtime = function hasProcessHrtime() {
  return typeof _process !== 'undefined' && _process !== null && _process.hrtime;
};

if (hasProcessHrtime()) {
  getNanoSeconds = function getNanoSeconds() {
    var hr = _process.hrtime();

    return hr[0] * 1e9 + hr[1];
  };

  loadTime = getNanoSeconds();
}

var R20 = /%20/g;

var isNeitherNullNorUndefined = function isNeitherNullNorUndefined(x) {
  return x !== null && x !== undefined;
};

var validKeys = function validKeys(entry) {
  return Object.keys(entry).filter(function (key) {
    return isNeitherNullNorUndefined(entry[key]);
  });
};

exports.validKeys = validKeys;

var buildRecursive = function buildRecursive(key, value) {
  var suffix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

  if (Array.isArray(value)) {
    return value.map(function (v) {
      return buildRecursive(key, v, suffix + '[]');
    }).join('&');
  }

  if (_typeof(value) !== 'object') {
    return "".concat(encodeURIComponent(key + suffix), "=").concat(encodeURIComponent(value));
  }

  return validKeys(value).map(function (k) {
    return buildRecursive(key, value[k], suffix + '[' + k + ']');
  }).join('&');
};

exports.buildRecursive = buildRecursive;

var toQueryString = function toQueryString(entry) {
  if (!isPlainObject(entry)) {
    return entry;
  }

  return validKeys(entry).map(function (key) {
    return buildRecursive(key, entry[key]);
  }).join('&').replace(R20, '+');
};
/**
 * Gives time in miliseconds, but with sub-milisecond precision for Browser
 * and Nodejs
 */


exports.toQueryString = toQueryString;

var performanceNow = function performanceNow() {
  if (hasProcessHrtime() && getNanoSeconds !== undefined) {
    var now = getNanoSeconds();

    if (now !== undefined && loadTime !== undefined) {
      return (now - loadTime) / 1e6;
    }
  }

  return Date.now();
};
/**
 * borrowed from: {@link https://gist.github.com/monsur/706839}
 * XmlHttpRequest's getAllResponseHeaders() method returns a string of response
 * headers according to the format described here:
 * {@link http://www.w3.org/TR/XMLHttpRequest/#the-getallresponseheaders-method}
 * This method parses that string into a user-friendly key/value pair object.
 */


exports.performanceNow = performanceNow;

var parseResponseHeaders = function parseResponseHeaders(headerStr) {
  var headers = {};

  if (!headerStr) {
    return headers;
  }

  var headerPairs = headerStr.split("\r\n");

  for (var i = 0; i < headerPairs.length; i++) {
    var headerPair = headerPairs[i]; // Can't use split() here because it does the wrong thing
    // if the header value has the string ": " in it.

    var index = headerPair.indexOf(": ");

    if (index > 0) {
      var key = headerPair.substring(0, index).toLowerCase().trim();
      var val = headerPair.substring(index + 2).trim();
      headers[key] = val;
    }
  }

  return headers;
};

exports.parseResponseHeaders = parseResponseHeaders;

var lowerCaseObjectKeys = function lowerCaseObjectKeys(obj) {
  return Object.keys(obj).reduce(function (target, key) {
    target[key.toLowerCase()] = obj[key];
    return target;
  }, {});
};

exports.lowerCaseObjectKeys = lowerCaseObjectKeys;
var hasOwnProperty = Object.prototype.hasOwnProperty;

var assign = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

exports.assign = assign;
var toString = Object.prototype.toString;

var isPlainObject = function isPlainObject(value) {
  return toString.call(value) === '[object Object]' && Object.getPrototypeOf(value) === Object.getPrototypeOf({});
};
/**
 * borrowed from: {@link https://github.com/davidchambers/Base64.js}
 */


exports.isPlainObject = isPlainObject;
var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

var btoa = function btoa(input) {
  var output = '';
  var map = CHARS;
  var str = String(input);

  for ( // initialize result and counter
  var block = 0, charCode, idx = 0; // if the next str index does not exist:
  //   change the mapping table to "="
  //   check if d has no fractional digits
  str.charAt(idx | 0) || (map = '=', idx % 1); // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
  output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
    charCode = str.charCodeAt(idx += 3 / 4);

    if (charCode > 0xFF) {
      throw new Error("[Mappersmith] 'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
    }

    block = block << 8 | charCode;
  }

  return output;
};

exports.btoa = btoa;

/***/ }),

/***/ 294:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

module.exports = __nccwpck_require__(219);


/***/ }),

/***/ 219:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


var net = __nccwpck_require__(808);
var tls = __nccwpck_require__(404);
var http = __nccwpck_require__(685);
var https = __nccwpck_require__(687);
var events = __nccwpck_require__(361);
var assert = __nccwpck_require__(491);
var util = __nccwpck_require__(837);


exports.httpOverHttp = httpOverHttp;
exports.httpsOverHttp = httpsOverHttp;
exports.httpOverHttps = httpOverHttps;
exports.httpsOverHttps = httpsOverHttps;


function httpOverHttp(options) {
  var agent = new TunnelingAgent(options);
  agent.request = http.request;
  return agent;
}

function httpsOverHttp(options) {
  var agent = new TunnelingAgent(options);
  agent.request = http.request;
  agent.createSocket = createSecureSocket;
  agent.defaultPort = 443;
  return agent;
}

function httpOverHttps(options) {
  var agent = new TunnelingAgent(options);
  agent.request = https.request;
  return agent;
}

function httpsOverHttps(options) {
  var agent = new TunnelingAgent(options);
  agent.request = https.request;
  agent.createSocket = createSecureSocket;
  agent.defaultPort = 443;
  return agent;
}


function TunnelingAgent(options) {
  var self = this;
  self.options = options || {};
  self.proxyOptions = self.options.proxy || {};
  self.maxSockets = self.options.maxSockets || http.Agent.defaultMaxSockets;
  self.requests = [];
  self.sockets = [];

  self.on('free', function onFree(socket, host, port, localAddress) {
    var options = toOptions(host, port, localAddress);
    for (var i = 0, len = self.requests.length; i < len; ++i) {
      var pending = self.requests[i];
      if (pending.host === options.host && pending.port === options.port) {
        // Detect the request to connect same origin server,
        // reuse the connection.
        self.requests.splice(i, 1);
        pending.request.onSocket(socket);
        return;
      }
    }
    socket.destroy();
    self.removeSocket(socket);
  });
}
util.inherits(TunnelingAgent, events.EventEmitter);

TunnelingAgent.prototype.addRequest = function addRequest(req, host, port, localAddress) {
  var self = this;
  var options = mergeOptions({request: req}, self.options, toOptions(host, port, localAddress));

  if (self.sockets.length >= this.maxSockets) {
    // We are over limit so we'll add it to the queue.
    self.requests.push(options);
    return;
  }

  // If we are under maxSockets create a new one.
  self.createSocket(options, function(socket) {
    socket.on('free', onFree);
    socket.on('close', onCloseOrRemove);
    socket.on('agentRemove', onCloseOrRemove);
    req.onSocket(socket);

    function onFree() {
      self.emit('free', socket, options);
    }

    function onCloseOrRemove(err) {
      self.removeSocket(socket);
      socket.removeListener('free', onFree);
      socket.removeListener('close', onCloseOrRemove);
      socket.removeListener('agentRemove', onCloseOrRemove);
    }
  });
};

TunnelingAgent.prototype.createSocket = function createSocket(options, cb) {
  var self = this;
  var placeholder = {};
  self.sockets.push(placeholder);

  var connectOptions = mergeOptions({}, self.proxyOptions, {
    method: 'CONNECT',
    path: options.host + ':' + options.port,
    agent: false,
    headers: {
      host: options.host + ':' + options.port
    }
  });
  if (options.localAddress) {
    connectOptions.localAddress = options.localAddress;
  }
  if (connectOptions.proxyAuth) {
    connectOptions.headers = connectOptions.headers || {};
    connectOptions.headers['Proxy-Authorization'] = 'Basic ' +
        new Buffer(connectOptions.proxyAuth).toString('base64');
  }

  debug('making CONNECT request');
  var connectReq = self.request(connectOptions);
  connectReq.useChunkedEncodingByDefault = false; // for v0.6
  connectReq.once('response', onResponse); // for v0.6
  connectReq.once('upgrade', onUpgrade);   // for v0.6
  connectReq.once('connect', onConnect);   // for v0.7 or later
  connectReq.once('error', onError);
  connectReq.end();

  function onResponse(res) {
    // Very hacky. This is necessary to avoid http-parser leaks.
    res.upgrade = true;
  }

  function onUpgrade(res, socket, head) {
    // Hacky.
    process.nextTick(function() {
      onConnect(res, socket, head);
    });
  }

  function onConnect(res, socket, head) {
    connectReq.removeAllListeners();
    socket.removeAllListeners();

    if (res.statusCode !== 200) {
      debug('tunneling socket could not be established, statusCode=%d',
        res.statusCode);
      socket.destroy();
      var error = new Error('tunneling socket could not be established, ' +
        'statusCode=' + res.statusCode);
      error.code = 'ECONNRESET';
      options.request.emit('error', error);
      self.removeSocket(placeholder);
      return;
    }
    if (head.length > 0) {
      debug('got illegal response body from proxy');
      socket.destroy();
      var error = new Error('got illegal response body from proxy');
      error.code = 'ECONNRESET';
      options.request.emit('error', error);
      self.removeSocket(placeholder);
      return;
    }
    debug('tunneling connection has established');
    self.sockets[self.sockets.indexOf(placeholder)] = socket;
    return cb(socket);
  }

  function onError(cause) {
    connectReq.removeAllListeners();

    debug('tunneling socket could not be established, cause=%s\n',
          cause.message, cause.stack);
    var error = new Error('tunneling socket could not be established, ' +
                          'cause=' + cause.message);
    error.code = 'ECONNRESET';
    options.request.emit('error', error);
    self.removeSocket(placeholder);
  }
};

TunnelingAgent.prototype.removeSocket = function removeSocket(socket) {
  var pos = this.sockets.indexOf(socket)
  if (pos === -1) {
    return;
  }
  this.sockets.splice(pos, 1);

  var pending = this.requests.shift();
  if (pending) {
    // If we have pending requests and a socket gets closed a new one
    // needs to be created to take over in the pool for the one that closed.
    this.createSocket(pending, function(socket) {
      pending.request.onSocket(socket);
    });
  }
};

function createSecureSocket(options, cb) {
  var self = this;
  TunnelingAgent.prototype.createSocket.call(self, options, function(socket) {
    var hostHeader = options.request.getHeader('host');
    var tlsOptions = mergeOptions({}, self.options, {
      socket: socket,
      servername: hostHeader ? hostHeader.replace(/:.*$/, '') : options.host
    });

    // 0 is dummy port for v0.6
    var secureSocket = tls.connect(0, tlsOptions);
    self.sockets[self.sockets.indexOf(socket)] = secureSocket;
    cb(secureSocket);
  });
}


function toOptions(host, port, localAddress) {
  if (typeof host === 'string') { // since v0.10
    return {
      host: host,
      port: port,
      localAddress: localAddress
    };
  }
  return host; // for v0.11 or later
}

function mergeOptions(target) {
  for (var i = 1, len = arguments.length; i < len; ++i) {
    var overrides = arguments[i];
    if (typeof overrides === 'object') {
      var keys = Object.keys(overrides);
      for (var j = 0, keyLen = keys.length; j < keyLen; ++j) {
        var k = keys[j];
        if (overrides[k] !== undefined) {
          target[k] = overrides[k];
        }
      }
    }
  }
  return target;
}


var debug;
if (process.env.NODE_DEBUG && /\btunnel\b/.test(process.env.NODE_DEBUG)) {
  debug = function() {
    var args = Array.prototype.slice.call(arguments);
    if (typeof args[0] === 'string') {
      args[0] = 'TUNNEL: ' + args[0];
    } else {
      args.unshift('TUNNEL:');
    }
    console.error.apply(console, args);
  }
} else {
  debug = function() {};
}
exports.debug = debug; // for test


/***/ }),

/***/ 491:
/***/ ((module) => {

"use strict";
module.exports = require("assert");

/***/ }),

/***/ 361:
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 685:
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ 687:
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ 808:
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ 37:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 17:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 404:
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),

/***/ 310:
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ 837:
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(3109);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map