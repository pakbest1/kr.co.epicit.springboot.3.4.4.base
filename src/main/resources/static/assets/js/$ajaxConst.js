const $ajax = (() => {
	// ESC 키로 모든 요청 중단
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			controller.abort({ name: 'UserAbort', message: '요청 사용자 취소' });
		}
	});

	function showIndicator(isShow=false) {
		this.obj_indicator = document.getElementById(this.indicator);
		if (!this.obj_indicator) {
			let div = document.createElement('div');
			div.id        = this.indicator;
			div.className = 'loading-overlay';  // loading-spinner';
			
			let indi = {
				top : (window.outerHeight + window.scrollY) / 2 - 160 +'px',
				left: (window.outerWidth  + window.scrollX) / 2 - 40 +'px',
			};
			div.innerHTML 
				= '<div class="spinner" style="top:'+ indi.top +'; left:'+ indi.left +';"></div>'
				+ '<div style="text-align:center; color:white; margin-top:10px;">🔄 로딩중...</div>'
			;  // 🔄 로딩중..';
			document.body.appendChild(div);
			this.obj_indicator = document.getElementById(this.indicator);
		}
		
		this.obj_indicator.style.display = isShow ? 'block' : 'none';
	};
	
	function abort(s) {
		if (this.controller) {
			try { this.controller.abort({ name: 'UserAbort', message: s }); } catch (e) {}
			this.controller = null;
			this.showIndicator(false);
			//console.warn('[Ajax] 요청이 ESC 키로 중단되었습니다.');
		}
	};
	
	async function request(url, method='GET', data = {}, headers = {}) {
		this.controller = new AbortController();
		const signal = this.controller.signal;
		this.showIndicator(true);
		
		let opts = {
			method: method.toUpperCase(),
			headers: {
				'Content-Type': 'application/json','Accept': 'application/json',
				...headers,
			},
			signal,
		};

		if (method !== 'GET') {
			opts.headers['Content-Type'] = 'application/json';
			opts.body = JSON.stringify(data);
		} else if (data && Object.keys(data).length) {
			const query = new URLSearchParams(data).toString();
			url += (!url.includes('?')?'?':'&')+`${query}`;
		}
		try {
			const response = await fetch(url, opts);
			if (!response.ok) {
				const errMsg = await response.text();
				throw new Error(`HTTP ${response.status}: ${errMsg}`);
			}
			const contentType = response.headers.get('Content-Type') || '';
			if (contentType.includes('application/json')) {
				return await response.json();
			} else {
				return await response.text();
			}
		} catch (err) {
			this.showIndicator(false);
			if (err.name === 'UserAbort') {  // 사용자 ESC 등으로 요청 취소됨 – 조용히 무시
				console.log('UserAbort:'+ url +'');
				return;
			} else {  // 공통 에러 처리 (사용자는 .catch 안 써도 됨)
				alert('요청 중 오류가 발생했습니다.');  //  + err.message);
				console.error('[AJAX 오류]', err);
				//return;  // 필요 시 throw로 다시 넘길 수도 있음
				throw error;
			}
		}
	}

	return {
		get   : (url, data = {}, headers = {}) => request('GET'   , url, data, headers),
		put   : (url, data = {}, headers = {}) => request('PUT'   , url, data, headers),
		post  : (url, data = {}, headers = {}) => request('POST'  , url, data, headers),
		delete: (url, data = {}, headers = {}) => request('DELETE', url, data, headers),
		
		showIndicator: (isShow=false) => showIndicator(isShow),
	};
})();
