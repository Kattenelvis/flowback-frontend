export interface Account {
	id: number;
	account_name: string;
	account_number: string;
	balance: number;
	created_by?: {
		id: number;
		username: string;
		profile_image: null | string;
		banner_image: null | string;
	};
}

export interface Transaction {
	id: number;
	account: Account;
	debit_amount: number | null;
	credit_amount: number | null;
	description: string;
	verification_number: string;
	date: string;
}

export interface Filter {
	account_ids: { id: number; checked: boolean; label: string }[];
	date_before: Date | null;
	date_after: Date | null;
	description: string | null;
}
