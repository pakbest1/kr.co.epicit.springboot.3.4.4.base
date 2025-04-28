(function($) {
	$.fn.jsbatisTemplate = function(data) {
		return $.jsbatisTemplateRender(this.html(), data);
	};

	$.jsbatisTemplateRender = function(template, context) {
		template = removeComments(template);
		template = render(template, context);
		return template;
	};

	function removeComments(template) {
		return template.replace(/<!--[\s\S]*?-->/g, '');
	}

	function render(template, context) {
		let prev;
		do {
			prev = template;
			template = template
				.replace(/<foreach([^>]*)>([\s\S]*?)<\/foreach>/g, (_, attrs, inner) => renderForeach(attrs, inner, context))
				.replace(/<choose>([\s\S]*?)<\/choose>/g, (_, inner) => renderChoose(inner, context))
				.replace(/<if\s+test\s*=\s*['"]([^'"]+)['"]\s*>([\s\S]*?)<\/if>/g, (_, test, inner) => evaluate(test, context) ? render(inner, context) : '');
		} while (template !== prev);

		return bindPlaceholders(template, context);
	}

	function renderForeach(attrs, inner, context) {
		const { collection, item = 'item', index = 'index', open = '', close = '', separator = '' } = parseAttrs(attrs);
		const items = get(context, collection) || [];
		if (!Array.isArray(items)) return '';

		const result = items.map((it, idx) => {
			const subContext = { ...context, [item]: it, [index]: idx };
			return render(inner, subContext).trim();
		}).filter(Boolean).join(separator);

		return open + result + close;
	}

	function renderChoose(inner, context) {
		const whenMatches = [...inner.matchAll(/<when\s+test\s*=\s*['"]([^'"]+)['"]\s*>([\s\S]*?)<\/when>/g)];
		for (const [, test, content] of whenMatches) {
			if (evaluate(test, context)) return render(content, context);
		}
		const otherwiseMatch = inner.match(/<otherwise>([\s\S]*?)<\/otherwise>/);
		return otherwiseMatch ? render(otherwiseMatch[1], context) : '';
	}

	function bindPlaceholders(template, context) {
		return template
			.replace(/\$\{\s*([^{}]+?)\s*\}/g, (_, expr) => resolve(expr, context, false))
			.replace(/#\{\s*([^{}]+?)\s*\}/g, (_, expr) => resolve(expr, context, true));
	}

	function resolve(expr, context, escape) {
		let [key, ...options] = expr.split(',').map(s => s.trim());
		const opts = options.reduce((acc, opt) => {
			const [k, v] = opt.split('=').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
			acc[k] = v;
			return acc;
		}, {});

		if (key === 'TODAY') return formatDate(new Date(), opts.format);

		let val = get(context, key);
		if (val == null) return '';
		if (opts.format && typeof val === 'string' && isDate(val)) val = formatDate(new Date(val), opts.format);

		return escape ? `'${escapeStr(val)}'` : val;
	}

	function parseAttrs(str) {
		return Object.fromEntries(
			[...str.matchAll(/(\w+)\s*=\s*['"]([^'"]+)['"]/g)].map(([, k, v]) => [k, v])
		);
	}

	function get(obj, path) {
		return path.split('.').reduce((o, k) => (o || {})[k], obj);
	}

	function evaluate(expr, context) {
		try {
			const safeExpr = expr.replace(/([a-zA-Z_][\w\.]*)/g, (m) =>
				['true', 'false', 'null'].includes(m) ? m : `get(context,"${m}")`
			);
			return Function('context', 'get', `return ${safeExpr};`)(context, get);
		} catch {
			return false;
		}
	}

	function escapeStr(str) {
		return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
	}

	function formatDate(date, fmt) {
		if (!fmt) return date.toISOString();
		return fmt
			.replace(/YYYY/g, date.getFullYear())
			.replace(/MM/g, pad(date.getMonth() + 1))
			.replace(/DD/g, pad(date.getDate()))
			.replace(/HH24/g, pad(date.getHours()))
			.replace(/MI/g, pad(date.getMinutes()))
			.replace(/SS/g, pad(date.getSeconds()));
	}

	function pad(num) {
		return num.toString().padStart(2, '0');
	}

	function isDate(str) {
		return !isNaN(Date.parse(str));
	}
})(jQuery);