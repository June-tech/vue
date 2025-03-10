/* @flow */

import config from 'core/config';
import { warn, cached } from 'core/util/index';
import { mark, measure } from 'core/util/perf';

import Vue from './runtime/index';
import { query } from './util/index';
import { compileToFunctions } from './compiler/index';
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat';

const idToTemplate = cached((id) => {
	const el = query(id);
	return el && el.innerHTML;
});
// 保留vue实例的$mount方法
const mount = Vue.prototype.$mount;
Vue.prototype.$mount = function (
	el?: string | Element,
	// 非ssr情况下为false,ssr时为true
	hydrating?: boolean
): Component {
  // 获取el对象
	el = el && query(el);

  /* istanbul ignore if */
  // el不能为body或者html
	if (el === document.body || el === document.documentElement) {
		process.env.NODE_ENV !== 'production' &&
			warn(`Do not mount Vue to <html> or <body> - mount to normal elements instead.`);
		return this;
	}

	const options = this.$options;
	// resolve template/el and convert to render function
	// 把template转换为render函数
	if (!options.render) {
    let template = options.template;
    // 如果模板存在
		if (template) {
			if (typeof template === 'string') {
				if (template.charAt(0) === '#') {
					template = idToTemplate(template);
					/* istanbul ignore if */
					if (process.env.NODE_ENV !== 'production' && !template) {
						warn(`Template element not found or is empty: ${options.template}`, this);
					}
				}
			} else if (template.nodeType) {
				template = template.innerHTML;
			} else {
				if (process.env.NODE_ENV !== 'production') {
					warn('invalid template option:' + template, this);
				}
				return this;
			}
		} else if (el) {
			template = getOuterHTML(el);
		}
		if (template) {
			/* istanbul ignore if */
			if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
				mark('compile');
			}

      // 把template转换为render函数
			const { render, staticRenderFns } = compileToFunctions(
				template,
				{
					outputSourceRange: process.env.NODE_ENV !== 'production',
					shouldDecodeNewlines,
					shouldDecodeNewlinesForHref,
					delimiters: options.delimiters,
					comments: options.comments
				},
				this
			);
			options.render = render;
			options.staticRenderFns = staticRenderFns;

			/* istanbul ignore if */
			if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
				mark('compile end');
				measure(`vue ${this._name} compile`, 'compile', 'compile end');
			}
		}
  }
  // 调用mount方法,渲染dom
	return mount.call(this, el, hydrating);
};

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el: Element): string {
	if (el.outerHTML) {
		return el.outerHTML;
	} else {
		const container = document.createElement('div');
		container.appendChild(el.cloneNode(true));
		return container.innerHTML;
	}
}

Vue.compile = compileToFunctions;

export default Vue;
