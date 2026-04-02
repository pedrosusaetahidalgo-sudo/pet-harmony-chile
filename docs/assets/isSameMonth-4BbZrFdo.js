import{n as O,a0 as f,$ as h,a2 as M,ac as s,a6 as y}from"./index-YeeFuW0l.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=O("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=O("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);function w(r,a,e){const t=f(r,e==null?void 0:e.in);return isNaN(a)?h((e==null?void 0:e.in)||r,NaN):(a&&t.setDate(t.getDate()+a),t)}function S(r,a,e){const t=f(r,e==null?void 0:e.in);if(isNaN(a))return h((e==null?void 0:e.in)||r,NaN);if(!a)return t;const c=t.getDate(),n=h((e==null?void 0:e.in)||r,t.getTime());n.setMonth(t.getMonth()+a+1,0);const u=n.getDate();return c>=u?n:(t.setFullYear(n.getFullYear(),n.getMonth(),c),t)}function m(r,a,e){const[t,c]=M(e==null?void 0:e.in,r,a);return+s(t)==+s(c)}function C(r,a){const e=f(r,a==null?void 0:a.in);return e.setDate(1),e.setHours(0,0,0,0),e}function F(r,a){var d,g,l,D;const e=y(),t=(a==null?void 0:a.weekStartsOn)??((g=(d=a==null?void 0:a.locale)==null?void 0:d.options)==null?void 0:g.weekStartsOn)??e.weekStartsOn??((D=(l=e.locale)==null?void 0:l.options)==null?void 0:D.weekStartsOn)??0,c=f(r,a==null?void 0:a.in),n=c.getDay(),u=(n<t?-7:0)+6-(n-t);return c.setDate(c.getDate()+u),c.setHours(23,59,59,999),c}function v(r,a,e){const[t,c]=M(e==null?void 0:e.in,r,a);return t.getFullYear()===c.getFullYear()&&t.getMonth()===c.getMonth()}export{_ as C,w as a,N as b,S as c,v as d,F as e,m as i,C as s};
