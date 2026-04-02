import{m as O}from"./index-CmWORZM2.js";import{t as n,c as h,n as m,d as M}from"./es--sG8wi-Q.js";import{a as s}from"./format-C_Tr9JbX.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=O("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=O("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);function S(r,t,e){const a=n(r,e==null?void 0:e.in);return isNaN(t)?h((e==null?void 0:e.in)||r,NaN):(t&&a.setDate(a.getDate()+t),a)}function C(r,t,e){const a=n(r,e==null?void 0:e.in);if(isNaN(t))return h((e==null?void 0:e.in)||r,NaN);if(!t)return a;const c=a.getDate(),f=h((e==null?void 0:e.in)||r,a.getTime());f.setMonth(a.getMonth()+t+1,0);const u=f.getDate();return c>=u?f:(a.setFullYear(f.getFullYear(),f.getMonth(),c),a)}function F(r,t,e){const[a,c]=m(e==null?void 0:e.in,r,t);return+s(a)==+s(c)}function v(r,t){const e=n(r,t==null?void 0:t.in);return e.setDate(1),e.setHours(0,0,0,0),e}function L(r,t){var d,g,l,D;const e=M(),a=(t==null?void 0:t.weekStartsOn)??((g=(d=t==null?void 0:t.locale)==null?void 0:d.options)==null?void 0:g.weekStartsOn)??e.weekStartsOn??((D=(l=e.locale)==null?void 0:l.options)==null?void 0:D.weekStartsOn)??0,c=n(r,t==null?void 0:t.in),f=c.getDay(),u=(f<a?-7:0)+6-(f-a);return c.setDate(c.getDate()+u),c.setHours(23,59,59,999),c}function Y(r,t,e){const[a,c]=m(e==null?void 0:e.in,r,t);return a.getFullYear()===c.getFullYear()&&a.getMonth()===c.getMonth()}export{w as C,S as a,_ as b,C as c,Y as d,L as e,F as i,v as s};
