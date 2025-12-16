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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var sharp_1 = require("sharp");
var FileManager_js_1 = require("./FileManager.js");
var file_type_1 = require("file-type");
var ImageEngine = /** @class */ (function () {
    function ImageEngine() {
    }
    ImageEngine.prototype.getDominantColorFromBuffer = function (buffer) {
        return __awaiter(this, void 0, void 0, function () {
            var data, r, g, b;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, sharp_1.default)(buffer)
                            .resize(1, 1)
                            .raw()
                            .toBuffer({ resolveWithObject: true })];
                    case 1:
                        data = (_a.sent()).data;
                        r = data[0], g = data[1], b = data[2];
                        return [2 /*return*/, "rgb(".concat(r, ", ").concat(g, ", ").concat(b, ")")];
                }
            });
        });
    };
    ImageEngine.prototype.createSimple = function (buffer, simpleSize) {
        return __awaiter(this, void 0, void 0, function () {
            var webpBuffer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, sharp_1.default)(buffer)
                            .resize({ width: simpleSize, withoutEnlargement: true })
                            .webp({ quality: 60 })
                            .toBuffer()];
                    case 1:
                        webpBuffer = _a.sent();
                        return [2 /*return*/, webpBuffer];
                }
            });
        });
    };
    ImageEngine.prototype.createPreview = function (buffer) {
        return __awaiter(this, void 0, void 0, function () {
            var webpBuffer, base64, dataUri;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, sharp_1.default)(buffer)
                            .resize({ width: 50, withoutEnlargement: true })
                            .webp({ quality: 20 })
                            .toBuffer()];
                    case 1:
                        webpBuffer = _a.sent();
                        base64 = webpBuffer.toString('base64');
                        dataUri = "data:image/webp;base64,".concat(base64);
                        return [2 /*return*/, dataUri];
                }
            });
        });
    };
    ImageEngine.prototype.create = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var type, res, fileName, simpleImage, _c, _d, _e, _f, err_1;
            var _g;
            var path = _b.path, file = _b.file, _h = _b.simpleSize, simpleSize = _h === void 0 ? 300 : _h, _j = _b.preview, preview = _j === void 0 ? false : _j;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0: return [4 /*yield*/, (0, file_type_1.fileTypeFromBuffer)(file)];
                    case 1:
                        type = _k.sent();
                        if ((type === null || type === void 0 ? void 0 : type.mime) === 'image/heic' || (type === null || type === void 0 ? void 0 : type.mime) === 'image/heif') {
                            console.warn("HEIC/HEIF \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u0438\u0433\u043D\u043E\u0440\u0438\u0440\u0443\u0435\u0442\u0441\u044F: ".concat(type.mime));
                            return [2 /*return*/, null];
                        }
                        _k.label = 2;
                    case 2:
                        _k.trys.push([2, 9, , 10]);
                        res = {};
                        return [4 /*yield*/, FileManager_js_1.default.saveFile(path, file)];
                    case 3:
                        fileName = _k.sent();
                        _d = (_c = FileManager_js_1.default).saveFile;
                        _e = ['simple'];
                        return [4 /*yield*/, this.createSimple(file, simpleSize)];
                    case 4: return [4 /*yield*/, _d.apply(_c, _e.concat([_k.sent()]))];
                    case 5:
                        simpleImage = _k.sent();
                        _g = {
                            file: fileName,
                            path: path
                        };
                        return [4 /*yield*/, this.getDominantColorFromBuffer(file)];
                    case 6:
                        res = (_g.aura = _k.sent(),
                            _g.simple = simpleImage,
                            _g);
                        if (!preview) return [3 /*break*/, 8];
                        _f = res;
                        return [4 /*yield*/, this.createPreview(file)];
                    case 7:
                        _f.preview = _k.sent();
                        _k.label = 8;
                    case 8: return [2 /*return*/, res];
                    case 9:
                        err_1 = _k.sent();
                        console.error('Ошибка при создании изображения:', err_1.message);
                        return [2 /*return*/, null];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    return ImageEngine;
}());
exports.default = ImageEngine;
