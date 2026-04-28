import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

type PixConvertCredentials = {
	baseUrl: string;
	adminApiKey?: string;
	extraHeaderName?: string;
	extraHeaderValue?: string;
};

type ToolOperation = {
	name: string;
	value: string;
	description: string;
	endpoint: string;
	maxFiles: number;
	defaultOutputName: string;
};

const toolOperations: ToolOperation[] = [
	{ name: 'Merge PDF', value: 'mergePdf', description: 'Merge multiple PDFs into one PDF', endpoint: '/api/v1/merge-pdf', maxFiles: 50, defaultOutputName: 'merged.pdf' },
	{ name: 'Split PDF', value: 'splitPdf', description: 'Split a PDF into selected pages or a ZIP of pages', endpoint: '/api/v1/split-pdf', maxFiles: 1, defaultOutputName: 'split-pages.zip' },
	{ name: 'Remove Pages', value: 'removePages', description: 'Remove selected pages from a PDF', endpoint: '/api/v1/remove-pages', maxFiles: 1, defaultOutputName: 'pages-removed.pdf' },
	{ name: 'Extract Pages', value: 'extractPages', description: 'Extract selected pages from a PDF', endpoint: '/api/v1/extract-pages', maxFiles: 1, defaultOutputName: 'extracted.pdf' },
	{ name: 'Organize PDF', value: 'organizePdf', description: 'Reorder PDF pages by index order', endpoint: '/api/v1/organize-pdf', maxFiles: 1, defaultOutputName: 'organized.pdf' },
	{ name: 'Scan to PDF', value: 'scanToPdf', description: 'Convert images into a scanned-style PDF', endpoint: '/api/v1/scan-to-pdf', maxFiles: 50, defaultOutputName: 'scanned.pdf' },
	{ name: 'Compress PDF', value: 'compressPdf', description: 'Compress a PDF using Ghostscript quality presets', endpoint: '/api/v1/compress-pdf', maxFiles: 1, defaultOutputName: 'compressed.pdf' },
	{ name: 'Repair PDF', value: 'repairPdf', description: 'Repair a damaged PDF with Ghostscript', endpoint: '/api/v1/repair-pdf', maxFiles: 1, defaultOutputName: 'repaired.pdf' },
	{ name: 'OCR PDF/Image', value: 'ocrPdf', description: 'Run OCR and return PDF or text', endpoint: '/api/v1/ocr-pdf', maxFiles: 1, defaultOutputName: 'ocr-result.pdf' },
	{ name: 'JPG to PDF', value: 'jpgToPdf', description: 'Convert images into a PDF', endpoint: '/api/v1/jpg-to-pdf', maxFiles: 50, defaultOutputName: 'images.pdf' },
	{ name: 'Word to PDF', value: 'wordToPdf', description: 'Convert DOC/DOCX to PDF', endpoint: '/api/v1/word-to-pdf', maxFiles: 1, defaultOutputName: 'converted.pdf' },
	{ name: 'PowerPoint to PDF', value: 'powerpointToPdf', description: 'Convert PPT/PPTX to PDF', endpoint: '/api/v1/powerpoint-to-pdf', maxFiles: 1, defaultOutputName: 'converted.pdf' },
	{ name: 'Excel to PDF', value: 'excelToPdf', description: 'Convert XLS/XLSX to PDF', endpoint: '/api/v1/excel-to-pdf', maxFiles: 1, defaultOutputName: 'converted.pdf' },
	{ name: 'HTML to PDF', value: 'htmlToPdf', description: 'Convert HTML file or URL to PDF', endpoint: '/api/v1/html-to-pdf', maxFiles: 1, defaultOutputName: 'converted.pdf' },
	{ name: 'PDF to JPG', value: 'pdfToJpg', description: 'Render PDF pages to JPG image(s)', endpoint: '/api/v1/pdf-to-jpg', maxFiles: 1, defaultOutputName: 'pdf-pages.zip' },
	{ name: 'PDF to Word', value: 'pdfToWord', description: 'Convert PDF to DOCX', endpoint: '/api/v1/pdf-to-word', maxFiles: 1, defaultOutputName: 'converted.docx' },
	{ name: 'PDF to PowerPoint', value: 'pdfToPowerpoint', description: 'Convert PDF to PPTX', endpoint: '/api/v1/pdf-to-powerpoint', maxFiles: 1, defaultOutputName: 'converted.pptx' },
	{ name: 'PDF to Excel', value: 'pdfToExcel', description: 'Convert PDF to XLSX', endpoint: '/api/v1/pdf-to-excel', maxFiles: 1, defaultOutputName: 'converted.xlsx' },
	{ name: 'PDF to PDF/A', value: 'pdfToPdfa', description: 'Convert PDF to archival PDF/A style output', endpoint: '/api/v1/pdf-to-pdfa', maxFiles: 1, defaultOutputName: 'archived.pdf' },
	{ name: 'Rotate PDF', value: 'rotatePdf', description: 'Rotate all or selected PDF pages', endpoint: '/api/v1/rotate-pdf', maxFiles: 1, defaultOutputName: 'rotated.pdf' },
	{ name: 'Add Page Numbers', value: 'addPageNumbers', description: 'Add page numbers to a PDF', endpoint: '/api/v1/add-page-numbers', maxFiles: 1, defaultOutputName: 'numbered.pdf' },
	{ name: 'Add Watermark', value: 'addWatermark', description: 'Add text or image watermark to a PDF', endpoint: '/api/v1/add-watermark', maxFiles: 2, defaultOutputName: 'watermarked.pdf' },
	{ name: 'Crop PDF', value: 'cropPdf', description: 'Crop PDF page margins', endpoint: '/api/v1/crop-pdf', maxFiles: 1, defaultOutputName: 'cropped.pdf' },
	{ name: 'Edit PDF', value: 'editPdf', description: 'Apply JSON annotations to a PDF', endpoint: '/api/v1/edit-pdf', maxFiles: 1, defaultOutputName: 'edited.pdf' },
	{ name: 'Unlock PDF', value: 'unlockPdf', description: 'Remove PDF password using the provided password', endpoint: '/api/v1/unlock-pdf', maxFiles: 1, defaultOutputName: 'unlocked.pdf' },
	{ name: 'Lock PDF', value: 'lockPdf', description: 'Encrypt a PDF with a password', endpoint: '/api/v1/lock-pdf', maxFiles: 1, defaultOutputName: 'locked.pdf' },
	{ name: 'Sign PDF', value: 'signPdf', description: 'Embed a signature image into a PDF', endpoint: '/api/v1/sign-pdf', maxFiles: 2, defaultOutputName: 'signed.pdf' },
	{ name: 'Redact PDF', value: 'redactPdf', description: 'Black out JSON-defined regions in a PDF', endpoint: '/api/v1/redact-pdf', maxFiles: 1, defaultOutputName: 'redacted.pdf' },
	{ name: 'Compare PDF', value: 'comparePdf', description: 'Create visual PDF diff image(s)', endpoint: '/api/v1/compare-pdf', maxFiles: 2, defaultOutputName: 'comparison.zip' },
	{ name: 'JPG to PNG', value: 'jpgToPng', description: 'Convert JPG image to PNG', endpoint: '/api/v1/jpg-to-png', maxFiles: 1, defaultOutputName: 'image.png' },
	{ name: 'PNG to JPG', value: 'pngToJpg', description: 'Convert PNG image to JPG', endpoint: '/api/v1/png-to-jpg', maxFiles: 1, defaultOutputName: 'image.jpg' },
	{ name: 'WebP to JPG', value: 'webpToJpg', description: 'Convert WebP image to JPG', endpoint: '/api/v1/webp-to-jpg', maxFiles: 1, defaultOutputName: 'image.jpg' },
	{ name: 'HEIC to JPG', value: 'heicToJpg', description: 'Convert HEIC image to JPG', endpoint: '/api/v1/heic-to-jpg', maxFiles: 1, defaultOutputName: 'image.jpg' },
	{ name: 'BMP to PNG', value: 'bmpToPng', description: 'Convert BMP image to PNG', endpoint: '/api/v1/bmp-to-png', maxFiles: 1, defaultOutputName: 'image.png' },
	{ name: 'Photo to Markdown', value: 'photoToMarkdown', description: 'OCR an image and return Markdown text', endpoint: '/api/v1/photo-to-markdown', maxFiles: 1, defaultOutputName: 'ocr-result.md' },
	{ name: 'Universal Convert', value: 'universalConvert', description: 'Convert supported files to a target format', endpoint: '/api/v1/convert', maxFiles: 1, defaultOutputName: 'converted.bin' },
	{ name: 'GIF Maker', value: 'gifMaker', description: 'Create an animated GIF from images', endpoint: '/api/v1/gif', maxFiles: 50, defaultOutputName: 'animation.gif' },
];

const toolOperationOptions = toolOperations.map(({ name, value, description }) => ({
	name,
	value,
	description,
}));

const utilityOperationOptions = [
	{ name: 'Delete Uploaded File', value: 'deleteFile', description: 'Delete an uploaded file by ID using admin key' },
	{ name: 'Get API Health', value: 'health', description: 'Read /api/v1/health' },
	{ name: 'Get Metrics Stats', value: 'getMetricsStats', description: 'Read aggregated usage metrics' },
	{ name: 'List Tools', value: 'tools', description: 'Read current /api/v1/tools catalog' },
	{ name: 'List Uploaded Files', value: 'listFiles', description: 'List uploads using admin key' },
	{ name: 'Send Contact Message', value: 'contact', description: 'Send a contact form message' },
	{ name: 'Track Tool Usage', value: 'trackUsage', description: 'Record a metrics event' },
	{ name: 'Upload Files', value: 'uploadFiles', description: 'Upload files to /api/upload' },
];

const advancedParameters: INodeProperties[] = [
	{ displayName: 'Target Format', name: 'to', type: 'string', default: '', description: 'Used by Universal Convert. Example: pdf, png, jpg, docx.' },
	{ displayName: 'Pages', name: 'pages', type: 'string', default: '', description: 'Page range string for split/remove/extract/rotate. Example: 1-3,5.' },
	{ displayName: 'Order JSON', name: 'order', type: 'string', typeOptions: { rows: 3 }, default: '', description: 'JSON array for Organize PDF. Example: [2,0,1].' },
	{ displayName: 'Annotations JSON', name: 'annotations', type: 'string', typeOptions: { rows: 4 }, default: '', description: 'JSON annotations array for Edit PDF.' },
	{ displayName: 'Regions JSON', name: 'regions', type: 'string', typeOptions: { rows: 4 }, default: '', description: 'JSON redaction regions array for Redact PDF.' },
	{ displayName: 'Password', name: 'password', type: 'string', typeOptions: { password: true }, default: '', description: 'Password for lock/unlock operations.' },
	{ displayName: 'Quality', name: 'quality', type: 'options', default: 'medium', options: [{ name: 'Low', value: 'low' }, { name: 'Medium', value: 'medium' }, { name: 'High', value: 'high' }, { name: 'Numeric 90', value: '90' }], description: 'PDF quality preset or numeric image quality where supported.' },
	{ displayName: 'DPI', name: 'dpi', type: 'number', default: 150, description: 'PDF to JPG render DPI.' },
	{ displayName: 'Language', name: 'lang', type: 'string', default: 'eng', description: 'Tesseract language code for OCR operations.' },
	{ displayName: 'Output Format', name: 'format', type: 'string', default: '', description: 'Used by OCR and HTML to PDF. Examples: pdf, txt, A4, Letter.' },
	{ displayName: 'Landscape', name: 'landscape', type: 'boolean', default: false, description: 'Landscape output for HTML to PDF.' },
	{ displayName: 'Orientation', name: 'orientation', type: 'options', default: 'portrait', options: [{ name: 'Portrait', value: 'portrait' }, { name: 'Landscape', value: 'landscape' }], description: 'Orientation for JPG to PDF.' },
	{ displayName: 'Margin', name: 'margin', type: 'number', default: 0, description: 'Margin in points for JPG to PDF.' },
	{ displayName: 'Text', name: 'text', type: 'string', default: '', description: 'Watermark text.' },
	{ displayName: 'Opacity', name: 'opacity', type: 'number', default: 0.3, description: 'Watermark opacity.' },
	{ displayName: 'Rotation', name: 'rotation', type: 'number', default: -45, description: 'Watermark rotation or PDF rotation angle where supported.' },
	{ displayName: 'Font Size', name: 'fontSize', type: 'number', default: 12, description: 'Font size for watermark/page numbers.' },
	{ displayName: 'Position', name: 'position', type: 'string', default: 'bottom-center', description: 'Page-number position. Example: bottom-center.' },
	{ displayName: 'Start From', name: 'startFrom', type: 'number', default: 1, description: 'First page number value.' },
	{ displayName: 'Page Number Format', name: 'pageNumberFormat', type: 'string', default: '{n}', description: 'Format for page numbering. Example: Page {n}.' },
	{ displayName: 'Page', name: 'page', type: 'number', default: 1, description: 'Page for PDF signing.' },
	{ displayName: 'X', name: 'x', type: 'number', default: 50, description: 'X coordinate for PDF signing.' },
	{ displayName: 'Y', name: 'y', type: 'number', default: 50, description: 'Y coordinate for PDF signing.' },
	{ displayName: 'Width', name: 'width', type: 'number', default: 150, description: 'Signature width.' },
	{ displayName: 'Height', name: 'height', type: 'number', default: 50, description: 'Signature height.' },
	{ displayName: 'Top', name: 'top', type: 'number', default: 0, description: 'Top crop margin.' },
	{ displayName: 'Right', name: 'right', type: 'number', default: 0, description: 'Right crop margin.' },
	{ displayName: 'Bottom', name: 'bottom', type: 'number', default: 0, description: 'Bottom crop margin.' },
	{ displayName: 'Left', name: 'left', type: 'number', default: 0, description: 'Left crop margin.' },
	{ displayName: 'Delay', name: 'delay', type: 'number', default: 500, description: 'GIF frame delay in milliseconds.' },
	{ displayName: 'Loop', name: 'loop', type: 'boolean', default: true, description: 'Whether generated GIF should loop.' },
	{ displayName: 'HTML URL', name: 'htmlUrl', type: 'string', default: '', description: 'Remote URL for HTML to PDF when input mode is URL.' },
];

function normalizeBaseUrl(baseUrl: string): string {
	return baseUrl.replace(/\/+$/, '');
}

function parseCsv(value: string): string[] {
	return value
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean);
}

function parseLines(value: string): string[] {
	return value
		.split(/\r?\n|,/)
		.map((part) => part.trim())
		.filter(Boolean);
}

function getFileNameFromDisposition(disposition: string | null, fallback: string): string {
	if (!disposition) return fallback;
	const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
	if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1].replace(/"/g, ''));
	const match = /filename="?([^";]+)"?/i.exec(disposition);
	return match?.[1] || fallback;
}

function getMimeFromFileName(fileName: string, fallback: string): string {
	const ext = fileName.toLowerCase().split('.').pop();
	const map: Record<string, string> = {
		pdf: 'application/pdf',
		zip: 'application/zip',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		png: 'image/png',
		gif: 'image/gif',
		webp: 'image/webp',
		docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		txt: 'text/plain',
		md: 'text/markdown',
	};
	return (ext && map[ext]) || fallback || 'application/octet-stream';
}

function getToolOperation(operation: string): ToolOperation {
	const tool = toolOperations.find((candidate) => candidate.value === operation);
	if (!tool) {
		throw new Error(`Unsupported PixConvert operation: ${operation}`);
	}
	return tool;
}

function appendIfSet(form: FormData, name: string, value: unknown): void {
	if (value === undefined || value === null || value === '') return;
	form.append(name, String(value));
}

export class PixConvert implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PixConvert',
		name: 'pixConvert',
		icon: 'file:pixconvert.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] === "tool" ? $parameter["operation"] : $parameter["utilityOperation"]}}',
		description: 'Use PixConvert PDF, image, media, analytics, contact, and admin APIs',
		defaults: {
			name: 'PixConvert',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'pixConvertApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				default: 'tool',
				options: [
					{ name: 'Tool', value: 'tool', description: 'Run a conversion or PDF/image/media tool' },
					{ name: 'Utility', value: 'utility', description: 'Use health, tools, metrics, contact, upload, or admin APIs' },
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				default: 'mergePdf',
				options: toolOperationOptions,
				displayOptions: {
					show: {
						resource: ['tool'],
					},
				},
			},
			{
				displayName: 'Operation',
				name: 'utilityOperation',
				type: 'options',
				default: 'health',
				options: utilityOperationOptions,
				displayOptions: {
					show: {
						resource: ['utility'],
					},
				},
			},
			{
				displayName: 'Input Mode',
				name: 'inputMode',
				type: 'options',
				default: 'binary',
				options: [
					{ name: 'Binary', value: 'binary' },
					{ name: 'Remote URL', value: 'url' },
					{ name: 'No File', value: 'none' },
				],
				displayOptions: {
					show: {
						resource: ['tool'],
					},
				},
			},
			{
				displayName: 'Binary Property',
				name: 'binaryProperty',
				type: 'string',
				default: 'data',
				description: 'Name of the input binary property to send as the first file.',
				displayOptions: {
					show: {
						resource: ['tool'],
						inputMode: ['binary'],
					},
				},
			},
			{
				displayName: 'Additional Binary Properties',
				name: 'additionalBinaryProperties',
				type: 'string',
				default: '',
				description: 'Comma-separated binary property names for multi-file operations such as Merge PDF, Sign PDF, Compare PDF, GIF Maker, and Add Watermark.',
				displayOptions: {
					show: {
						resource: ['tool'],
						inputMode: ['binary'],
					},
				},
			},
			{
				displayName: 'Remote URLs',
				name: 'remoteUrls',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'One URL per line or comma-separated. PixConvert server-side SSRF protections apply.',
				displayOptions: {
					show: {
						resource: ['tool'],
						inputMode: ['url'],
					},
				},
			},
			{
				displayName: 'Return Mode',
				name: 'returnMode',
				type: 'options',
				default: 'binary',
				options: [
					{ name: 'Binary', value: 'binary', description: 'Return the processed file as n8n binary data' },
					{ name: 'URL JSON', value: 'url', description: 'Ask PixConvert to store the output temporarily and return JSON with a URL' },
				],
				displayOptions: {
					show: {
						resource: ['tool'],
					},
				},
			},
			{
				displayName: 'Output Binary Property',
				name: 'outputBinaryProperty',
				type: 'string',
				default: 'data',
				displayOptions: {
					show: {
						resource: ['tool'],
						returnMode: ['binary'],
					},
				},
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				default: {},
				placeholder: 'Add Option',
				options: advancedParameters,
				displayOptions: {
					show: {
						resource: ['tool'],
					},
				},
			},
			{
				displayName: 'Input Binary Property',
				name: 'utilityBinaryProperty',
				type: 'string',
				default: 'data',
				description: 'First binary property to upload for the Upload Files utility.',
				displayOptions: {
					show: {
						resource: ['utility'],
						utilityOperation: ['uploadFiles'],
					},
				},
			},
			{
				displayName: 'Additional Binary Properties',
				name: 'utilityAdditionalBinaryProperties',
				type: 'string',
				default: '',
				description: 'Comma-separated extra binary property names for Upload Files.',
				displayOptions: {
					show: {
						resource: ['utility'],
						utilityOperation: ['uploadFiles'],
					},
				},
			},
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['utility'],
						utilityOperation: ['deleteFile'],
					},
				},
			},
			{
				displayName: 'Period',
				name: 'period',
				type: 'options',
				default: 'monthly',
				options: [
					{ name: 'Daily', value: 'daily' },
					{ name: 'Weekly', value: 'weekly' },
					{ name: 'Monthly', value: 'monthly' },
					{ name: 'Yearly', value: 'yearly' },
				],
				displayOptions: {
					show: {
						resource: ['utility'],
						utilityOperation: ['getMetricsStats'],
					},
				},
			},
			{
				displayName: 'Tool Slug',
				name: 'toolSlug',
				type: 'string',
				default: 'merge-pdf',
				displayOptions: {
					show: {
						resource: ['utility'],
						utilityOperation: ['trackUsage'],
					},
				},
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 1,
				displayOptions: {
					show: {
						resource: ['utility'],
						utilityOperation: ['trackUsage'],
					},
				},
			},
			{
				displayName: 'Name',
				name: 'contactName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['utility'],
						utilityOperation: ['contact'],
					},
				},
			},
			{
				displayName: 'Email',
				name: 'contactEmail',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['utility'],
						utilityOperation: ['contact'],
					},
				},
			},
			{
				displayName: 'Subject',
				name: 'contactSubject',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['utility'],
						utilityOperation: ['contact'],
					},
				},
			},
			{
				displayName: 'Message',
				name: 'contactMessage',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['utility'],
						utilityOperation: ['contact'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('pixConvertApi') as PixConvertCredentials;
		const baseUrl = normalizeBaseUrl(credentials.baseUrl);

		for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
			const resource = this.getNodeParameter('resource', itemIndex) as string;

				try {
					if (resource === 'utility') {
						const result = await PixConvert.executeUtility(this, itemIndex, baseUrl, credentials);
						returnData.push(...result);
						continue;
					}

					const result = await PixConvert.executeTool(this, itemIndex, baseUrl, credentials);
					returnData.push(result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
						},
						pairedItem: {
							item: itemIndex,
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}

	private static buildHeaders(credentials: PixConvertCredentials, admin = false): Headers {
		const headers = new Headers();
		if (admin && credentials.adminApiKey) {
			headers.set('x-admin-key', credentials.adminApiKey);
		}
		if (credentials.extraHeaderName && credentials.extraHeaderValue) {
			headers.set(credentials.extraHeaderName, credentials.extraHeaderValue);
		}
		return headers;
	}

	private static async executeTool(ctx: IExecuteFunctions, itemIndex: number, baseUrl: string, credentials: PixConvertCredentials): Promise<INodeExecutionData> {
		const operation = ctx.getNodeParameter('operation', itemIndex) as string;
		const tool = getToolOperation(operation);
		const inputMode = ctx.getNodeParameter('inputMode', itemIndex) as string;
		const returnMode = ctx.getNodeParameter('returnMode', itemIndex) as string;
		const options = ctx.getNodeParameter('options', itemIndex, {}) as Record<string, unknown>;
		const form = new FormData();

		if (inputMode === 'binary') {
			await PixConvert.appendBinaryFiles(ctx, itemIndex, form, 'binaryProperty', 'additionalBinaryProperties', tool.maxFiles);
		} else if (inputMode === 'url') {
			const htmlUrl = typeof options.htmlUrl === 'string' && options.htmlUrl ? options.htmlUrl : '';
			const remoteUrls = parseLines(ctx.getNodeParameter('remoteUrls', itemIndex, '') as string);
			const urls = htmlUrl && operation === 'htmlToPdf' ? [htmlUrl] : remoteUrls;
			if (urls.length === 0) {
				throw new NodeOperationError(ctx.getNode(), 'Provide at least one Remote URL or HTML URL.');
			}
			for (const url of urls.slice(0, tool.maxFiles)) {
				form.append('urls', url);
			}
			if (operation === 'htmlToPdf' && urls[0]) {
				form.append('htmlUrl', urls[0]);
			}
		}

		PixConvert.appendToolOptions(form, options);

		const query = returnMode === 'url' ? '?output=url' : '';
		const response = await fetch(`${baseUrl}${tool.endpoint}${query}`, {
			method: 'POST',
			headers: PixConvert.buildHeaders(credentials),
			body: form,
		});

		return PixConvert.toN8nOutput(ctx, itemIndex, response, tool.defaultOutputName, returnMode);
	}

	private static async executeUtility(ctx: IExecuteFunctions, itemIndex: number, baseUrl: string, credentials: PixConvertCredentials): Promise<INodeExecutionData[]> {
		const operation = ctx.getNodeParameter('utilityOperation', itemIndex) as string;

		if (operation === 'uploadFiles') {
			const form = new FormData();
			await PixConvert.appendBinaryFiles(ctx, itemIndex, form, 'utilityBinaryProperty', 'utilityAdditionalBinaryProperties', 50);
			const response = await fetch(`${baseUrl}/api/upload`, {
				method: 'POST',
				headers: PixConvert.buildHeaders(credentials),
				body: form,
			});
			return [await PixConvert.toJsonOutput(ctx, itemIndex, response)];
		}

		if (operation === 'health') {
			return [await PixConvert.requestJson(ctx, itemIndex, `${baseUrl}/api/v1/health`, credentials)];
		}

		if (operation === 'tools') {
			return [await PixConvert.requestJson(ctx, itemIndex, `${baseUrl}/api/v1/tools`, credentials)];
		}

		if (operation === 'getMetricsStats') {
			const period = ctx.getNodeParameter('period', itemIndex) as string;
			return [await PixConvert.requestJson(ctx, itemIndex, `${baseUrl}/api/metrics/stats?period=${encodeURIComponent(period)}`, credentials)];
		}

		if (operation === 'trackUsage') {
			const tool = ctx.getNodeParameter('toolSlug', itemIndex) as string;
			const count = ctx.getNodeParameter('count', itemIndex) as number;
			const response = await fetch(`${baseUrl}/api/metrics/track`, {
				method: 'POST',
				headers: new Headers({
					...Object.fromEntries(PixConvert.buildHeaders(credentials).entries()),
					'content-type': 'application/json',
				}),
				body: JSON.stringify({ tool, count }),
			});
			return [await PixConvert.toJsonOutput(ctx, itemIndex, response)];
		}

		if (operation === 'contact') {
			const response = await fetch(`${baseUrl}/api/contact`, {
				method: 'POST',
				headers: new Headers({
					...Object.fromEntries(PixConvert.buildHeaders(credentials).entries()),
					'content-type': 'application/json',
				}),
				body: JSON.stringify({
					name: ctx.getNodeParameter('contactName', itemIndex),
					email: ctx.getNodeParameter('contactEmail', itemIndex),
					subject: ctx.getNodeParameter('contactSubject', itemIndex),
					message: ctx.getNodeParameter('contactMessage', itemIndex),
				}),
			});
			return [await PixConvert.toJsonOutput(ctx, itemIndex, response)];
		}

		if (operation === 'listFiles') {
			return [await PixConvert.requestJson(ctx, itemIndex, `${baseUrl}/api/files`, credentials, true)];
		}

		if (operation === 'deleteFile') {
			const fileId = ctx.getNodeParameter('fileId', itemIndex) as string;
			const response = await fetch(`${baseUrl}/api/files/${encodeURIComponent(fileId)}`, {
				method: 'DELETE',
				headers: PixConvert.buildHeaders(credentials, true),
			});
			return [await PixConvert.toJsonOutput(ctx, itemIndex, response)];
		}

		throw new NodeOperationError(ctx.getNode(), `Unsupported utility operation: ${operation}`);
	}

	private static async requestJson(ctx: IExecuteFunctions, itemIndex: number, url: string, credentials: PixConvertCredentials, admin = false): Promise<INodeExecutionData> {
		const response = await fetch(url, {
			method: 'GET',
			headers: PixConvert.buildHeaders(credentials, admin),
		});
		return PixConvert.toJsonOutput(ctx, itemIndex, response);
	}

	private static async appendBinaryFiles(ctx: IExecuteFunctions, itemIndex: number, form: FormData, primaryParameter: string, additionalParameter: string, maxFiles: number): Promise<void> {
		const primary = ctx.getNodeParameter(primaryParameter, itemIndex) as string;
		const additional = parseCsv(ctx.getNodeParameter(additionalParameter, itemIndex, '') as string);
		const properties = [primary, ...additional].slice(0, maxFiles);

		if (properties.length === 0 || !properties[0]) {
			throw new NodeOperationError(ctx.getNode(), 'No binary property configured.');
		}

		for (const property of properties) {
			const binary = ctx.helpers.assertBinaryData(itemIndex, property);
			const buffer = await ctx.helpers.getBinaryDataBuffer(itemIndex, property);
			const mimeType = binary.mimeType || 'application/octet-stream';
			const fileName = binary.fileName || `${property}.bin`;
			form.append('files', new Blob([new Uint8Array(buffer)], { type: mimeType }), fileName);
		}
	}

	private static appendToolOptions(form: FormData, options: Record<string, unknown>): void {
		const mappings: Array<[string, string]> = [
			['to', 'to'],
			['pages', 'pages'],
			['order', 'order'],
			['annotations', 'annotations'],
			['regions', 'regions'],
			['password', 'password'],
			['quality', 'quality'],
			['dpi', 'dpi'],
			['lang', 'lang'],
			['format', 'format'],
			['landscape', 'landscape'],
			['orientation', 'orientation'],
			['margin', 'margin'],
			['text', 'text'],
			['opacity', 'opacity'],
			['rotation', 'rotation'],
			['fontSize', 'fontSize'],
			['position', 'position'],
			['startFrom', 'startFrom'],
			['pageNumberFormat', 'format'],
			['page', 'page'],
			['x', 'x'],
			['y', 'y'],
			['width', 'width'],
			['height', 'height'],
			['top', 'top'],
			['right', 'right'],
			['bottom', 'bottom'],
			['left', 'left'],
			['delay', 'delay'],
			['loop', 'loop'],
			['htmlUrl', 'htmlUrl'],
		];

		for (const [source, target] of mappings) {
			appendIfSet(form, target, options[source]);
		}
	}

	private static async toN8nOutput(ctx: IExecuteFunctions, itemIndex: number, response: Response, fallbackName: string, returnMode: string): Promise<INodeExecutionData> {
		if (!response.ok) {
			throw new NodeOperationError(ctx.getNode(), await PixConvert.readError(response));
		}

		const contentType = response.headers.get('content-type') || 'application/octet-stream';
		if (returnMode === 'url' || contentType.includes('application/json')) {
			return PixConvert.toJsonOutput(ctx, itemIndex, response);
		}

		const fileName = getFileNameFromDisposition(response.headers.get('content-disposition'), fallbackName);
		const mimeType = getMimeFromFileName(fileName, contentType);
		const buffer = Buffer.from(await response.arrayBuffer());
		const outputBinaryProperty = ctx.getNodeParameter('outputBinaryProperty', itemIndex) as string;
		const binaryData = await ctx.helpers.prepareBinaryData(buffer, fileName, mimeType);

		return {
			json: {
				fileName,
				mimeType,
				size: buffer.length,
			},
			binary: {
				[outputBinaryProperty]: binaryData,
			},
			pairedItem: {
				item: itemIndex,
			},
		};
	}

	private static async toJsonOutput(ctx: IExecuteFunctions, itemIndex: number, response: Response): Promise<INodeExecutionData> {
		if (!response.ok) {
			throw new NodeOperationError(ctx.getNode(), await PixConvert.readError(response));
		}
		const contentType = response.headers.get('content-type') || '';
		const json = contentType.includes('application/json')
			? await response.json() as INodeExecutionData['json']
			: { body: await response.text() };
		return {
			json,
			pairedItem: {
				item: itemIndex,
			},
		};
	}

	private static async readError(response: Response): Promise<string> {
		const contentType = response.headers.get('content-type') || '';
		if (contentType.includes('application/json')) {
			try {
				const body = await response.json() as { error?: string; message?: string };
				return body.error || body.message || `PixConvert request failed with status ${response.status}`;
			} catch {
				return `PixConvert request failed with status ${response.status}`;
			}
		}
		const text = await response.text();
		return text || `PixConvert request failed with status ${response.status}`;
	}
}
