<script lang="ts">
    import { Accounts } from '../../../../models/account';

    const selfStore = Accounts.self;
    const self = $selfStore;

    const settingsStore = Accounts.Settings.fromProperty(
        'accountId',
        self.id,
        true
    );

    const settings = $settingsStore;
</script>
