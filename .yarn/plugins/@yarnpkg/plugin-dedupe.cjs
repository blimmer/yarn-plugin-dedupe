/* eslint-disable */
//prettier-ignore
module.exports = {
name: "@yarnpkg/plugin-dedupe",
factory: function (require) {
var plugin=(()=>{var i=Object.defineProperty;var l=Object.getOwnPropertyDescriptor;var u=Object.getOwnPropertyNames;var g=Object.prototype.hasOwnProperty;var p=(o,e)=>{for(var n in e)i(o,n,{get:e[n],enumerable:!0})},r=(o,e,n,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let d of u(e))!g.call(o,d)&&d!==n&&i(o,d,{get:()=>e[d],enumerable:!(t=l(e,d))||t.enumerable});return o};var a=o=>r(i({},"__esModule",{value:!0}),o);var f={};p(f,{default:()=>s});var c={configuration:{dedupePluginMode:{type:"string",default:"all",description:"The mode to use for deduplication",choices:["all","production","none"]}},hooks:{afterAllInstalled:async(o,e)=>{let n=o.configuration.get("dedupePluginMode");debugger}}},s=c;return a(f);})();
return plugin;
}
};
