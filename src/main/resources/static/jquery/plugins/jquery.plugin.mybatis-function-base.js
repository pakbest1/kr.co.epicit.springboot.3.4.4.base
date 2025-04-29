(function($) {
	
	$.fn.render = function(data) {
		
		// 1. HTML/XML 템플릿을 DOMParser로 트리 구조로 변환
		function parseTemplateToDOM(template) {
			// <root> 자동 래핑 (유효한 XML로 만들기 위해)
			const wrapped = `<root>${template}</root>`;
			return new DOMParser().parseFromString(wrapped, 'application/xml').documentElement;
		}

		// 2. 노드 트리를 재귀적으로 순회하며 처리
		function processNode(node, context) {
			const tag = node.nodeName;
			
			if (node.nodeType === 3) { // Text node
				return bindPlaceholders(node.textContent, context);
			}
			
			switch (tag) {
				case 'if':
					return handleIf(node, context);
				case 'foreach':
					return handleForeach(node, context);
				case 'choose':
					return handleChoose(node, context);
				case 'when':
				case 'otherwise':
					// handled in choose
					return '';
				default:
					return Array.from(node.childNodes).map(child => processNode(child, context)).join('');
			}
		}
		
		// 3. 각 태그 핸들러
		//   if 태그 처리
		function handleIf(node, context) {
			const test = node.getAttribute('test');
			if (evaluate(test, context)) {
				return Array.from(node.childNodes).map(child => processNode(child, context)).join('');
			}
			return '';
		}
		
		//   foreach 태그 처리
		function handleForeach(node, context) {
			const collection = getValue(node.getAttribute('collection'), context);
			const item = node.getAttribute('item') || 'item';
			const indexAttr = node.getAttribute('index') || 'index';
			const open = node.getAttribute('open') || '';
			const close = node.getAttribute('close') || '';
			const separator = node.getAttribute('separator') || '';

			if (!Array.isArray(collection)) return '';

			const body = collection.map((row, idx) => {
				const subContext = { ...context };
				subContext[item] = row;
				subContext[indexAttr] = idx;
				return Array.from(node.childNodes).map(child => processNode(child, subContext)).join('');
			});

			return open + body.join(separator) + close;
		}
		
		//   choose 태그 처리
		function handleChoose(node, context) {
			const children = Array.from(node.childNodes);
			for (const child of children) {
				if (child.nodeName === 'when') {
					if (evaluate(child.getAttribute('test'), context)) {
						return Array.from(child.childNodes).map(c => processNode(c, context)).join('');
					}
				}
			}

			const otherwise = children.find(c => c.nodeName === 'otherwise');
			if (otherwise) {
				return Array.from(otherwise.childNodes).map(c => processNode(c, context)).join('');
			}

			return '';
		}
		
		// 4. 바인딩과 이스케이프
		function bindPlaceholders(text, context) {
			return text
				.replace(/\$\{\s*(.*?)\s*\}/g, (_, expr) => getValue(expr, context))
				.replace(/#\{\s*(.*?)\s*\}/g , (_, expr) => `"${escapeValue(getValue(expr, context))}"`);
		}
		
		// 5. 평가 및 값 추출
		function getValue(path, context) {
			return path.split('.').reduce((acc, key) => acc?.[key], context);
		}
		
		function evaluate(expr, context) {
			try {
				const func = new Function(...Object.keys(context), `return ${expr};`);
				return func(...Object.values(context));
			} catch {
				return false;
			}
		}
		
		function escapeValue(value) {
			return String(value).replace(/["'\\]/g, '\\$&');
		}
		
		// 실제 사용
		const template = `...`; // 위 HTML
		const dom = parseTemplateToDOM(template);
		const result = processNode(dom, context);
		console.log(result);  // ("Alice", "Charlie")
		
	};
	
})(jQuery);