"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchResult = exports.DiscussionFormat = exports.LogLevel = exports.Role = void 0;
var Role;
(function (Role) {
    Role["VIEWER"] = "viewer";
    Role["DISCUSSOR"] = "discussor";
})(Role || (exports.Role = Role = {}));
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "ERROR";
    LogLevel["WARN"] = "WARN";
    LogLevel["INFO"] = "INFO";
    LogLevel["DEBUG"] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
var DiscussionFormat;
(function (DiscussionFormat) {
    DiscussionFormat["CASUAL"] = "casual";
    DiscussionFormat["FORMAL"] = "formal";
    DiscussionFormat["PANEL"] = "panel";
})(DiscussionFormat || (exports.DiscussionFormat = DiscussionFormat = {}));
var MatchResult;
(function (MatchResult) {
    MatchResult["SUCCESS"] = "success";
    MatchResult["EXPIRED"] = "expired";
    MatchResult["REJECTED"] = "rejected";
    MatchResult["ERROR"] = "error";
})(MatchResult || (exports.MatchResult = MatchResult = {}));
