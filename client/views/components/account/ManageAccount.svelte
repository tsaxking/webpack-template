<script lang="ts">
    import { Account } from '../../../models/account';
    import InputSubmit from '../bootstrap/InputSubmit.svelte';
    import { socket } from '../../../utilities/socket';

    export let username: string;
    export let firstName: string;
    export let lastName: string;
    export let email: string;
    export let roles: string[];
    export let account: Account;

    const handleSubmit = ({ detail }) => {
        console.log(detail);

        switch (detail.label) {
            case 'Username':
                account.changeUsername(detail.value);
                break;
            case 'First Name':
                account.changeFirstName(detail.value);
                break;
            case 'Last Name':
                account.changeLastName(detail.value);
                break;
            case 'Email':
                account.changeEmail(detail.value);
                break;
            default:
                console.log('Unknown label: ' + detail.label);
                break;
        }
    }
</script>





<div class="container">
    <div class="row mb-3">
        <div class="col-12">
            <h1>Manage Account: {username}</h1>
        </div>
    </div>

    <div class="row mb-3">
        <InputSubmit value={username} label="Username" buttonColor="success" placeholder="myUsername" on:save={handleSubmit}></InputSubmit>
        <InputSubmit value={firstName} label="First Name" buttonColor="success" placeholder="John" on:save={handleSubmit}></InputSubmit>
        <InputSubmit value={lastName} label="Last Name" buttonColor="success" placeholder="Smith" on:save={handleSubmit}></InputSubmit>
        <InputSubmit value={email} label="Email" buttonColor="success" placeholder="johnsmith@gmail.com" on:save={handleSubmit}></InputSubmit>
    </div>

    <div class="row mb-3">
        <div class="col-12">
            <h2>Roles</h2>
        </div>
    </div>

    {#if (roles.length > 0)}
        <div class="row mb-3">
            {#each roles as role} 
                <span>{role}</span>
            {/each}
        </div>
        {:else}
        <div class="row mb-3">
            <span>No roles</span>
        </div>
    {/if}
</div>