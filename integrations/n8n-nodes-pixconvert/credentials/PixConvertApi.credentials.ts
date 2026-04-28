import type {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PixConvertApi implements ICredentialType {
	name = 'pixConvertApi';

	displayName = 'PixConvert API';

	documentationUrl = 'https://github.com/rushikeshsakharleofficial/pixconvert';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'http://localhost:3000',
			placeholder: 'https://your-pixconvert-api.example.com',
			description: 'PixConvert API origin. Use the Express API URL, not a static-only Vercel frontend unless you only use local browser features.',
			required: true,
		},
		{
			displayName: 'Admin API Key',
			name: 'adminApiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Optional x-admin-key value for admin file operations.',
		},
		{
			displayName: 'Extra Header Name',
			name: 'extraHeaderName',
			type: 'string',
			default: '',
			description: 'Optional custom authentication header name for deployments protected by a proxy.',
		},
		{
			displayName: 'Extra Header Value',
			name: 'extraHeaderValue',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Optional custom authentication header value.',
		},
	];
}
