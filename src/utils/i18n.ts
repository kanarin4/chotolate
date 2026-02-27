import type { Language } from '../types'

export type TranslationKey =
    | 'settings'
    | 'en'
    | 'jp'
    | 'language'
    | 'staff'
    | 'newcomer'
    | 'container'
    | 'staff_bank'
    | 'newcomer_bank'
    | 'completed_bank'
    | 'setup_mode'
    | 'command_mode'
    | 'search_placeholder'
    | 'add'
    | 'export_board'
    | 'import_board'
    | 'export_csv'
    | 'import_csv'
    | 'data'
    | 'templates'
    | 'default_names'
    | 'quick_add'
    | 'snapshots'
    | 'save_now'
    | 'refresh'
    | 'restore'
    | 'saving'
    | 'refreshing'
    | 'restoring'
    | 'no_snapshots'
    | 'added_this_session'
    | 'delete_container'
    | 'confirm_delete'
    | 'undo'
    | 'close'
    | 'staff_template'
    | 'newcomer_template'
    | 'container_template'
    | 'front_gate'
    | 'house'
    | 'paprika'
    | 'turmeric'
    | 'rosemary'
    | 'basil'
    | 'clear_history'
    | 'clear_history_confirm'

const translations: Record<Language, Record<TranslationKey, string>> = {
    en: {
        settings: 'Settings',
        en: 'EN',
        jp: 'JP',
        language: 'Language',
        staff: 'Staff',
        newcomer: 'Newcomer',
        container: 'Container',
        staff_bank: 'Staff Bank',
        newcomer_bank: 'Newcomer Bank',
        completed_bank: 'Completed',
        setup_mode: 'Setup',
        command_mode: 'Command',
        search_placeholder: 'Search tiles...',
        add: 'Add',
        export_board: 'Export board',
        import_board: 'Import board',
        export_csv: 'Export CSV',
        import_csv: 'Import CSV',
        data: 'Data',
        templates: 'Templates',
        default_names: 'Default Names',
        quick_add: 'Quick Add (Tab)',
        snapshots: 'Snapshots',
        save_now: 'Save now',
        refresh: 'Refresh',
        restore: 'Restore',
        saving: 'Saving...',
        refreshing: 'Refreshing...',
        restoring: 'Restoring...',
        no_snapshots: 'No snapshots yet.',
        added_this_session: 'Added this session',
        delete_container: 'Delete',
        confirm_delete: 'Confirm delete',
        undo: 'Undo',
        close: 'Close',
        staff_template: 'Staff template',
        newcomer_template: 'Newcomer template',
        container_template: 'Container template',
        front_gate: 'Front Gate',
        house: 'House',
        paprika: 'Paprika',
        turmeric: 'Turmeric',
        rosemary: 'Rosemary',
        basil: 'Basil',
        clear_history: 'Clear History',
        clear_history_confirm: 'Are you sure you want to remove all past auto-saves and reset the current board? Everything will be lost.',
    },
    jp: {
        settings: '設定',
        en: 'EN',
        jp: 'JP',
        language: '言語',
        staff: 'スタッフ',
        newcomer: '新入寮生',
        container: 'ポジション',
        staff_bank: 'スタッフ一覧',
        newcomer_bank: '新入寮生一覧',
        completed_bank: '完了分',
        setup_mode: '編集',
        command_mode: '司令',
        search_placeholder: 'タイルを検索...',
        add: '追加',
        export_board: 'ボードを書き出す',
        import_board: 'ボードを取り込む',
        export_csv: 'CSV書き出し',
        import_csv: 'CSV取り込み',
        data: 'データ',
        templates: 'テンプレート',
        default_names: 'デフォルト名',
        quick_add: 'クイック追加',
        snapshots: 'スナップショット',
        save_now: '今すぐ保存',
        refresh: '更新',
        restore: '復元',
        saving: '保存中...',
        refreshing: '更新中...',
        restoring: '復元中...',
        no_snapshots: 'スナップショットはありません。',
        added_this_session: '今回のセッションで追加',
        delete_container: '削除',
        confirm_delete: '削除の確認',
        undo: '元に戻す',
        close: '閉じる',
        staff_template: 'スタッフ テンプレート',
        newcomer_template: '新入寮生 テンプレート',
        container_template: 'ポジション テンプレート',
        front_gate: '正門',
        house: 'ハウス',
        paprika: 'パプリカ',
        turmeric: 'ターメリック',
        rosemary: 'ローズマリー',
        basil: 'バジル',
        clear_history: '履歴を消去',
        clear_history_confirm: 'すべての過去の自動保存を削除し、現在のボードをリセットしてもよろしいですか？すべてのデータが失われます。',
    },
}

export function t(key: TranslationKey, lang: Language): string {
    return translations[lang][key] || key
}
