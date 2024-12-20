<script lang="ts">
    import { Accounts } from '../../models/account';
    import { ServerRequest } from '../../utilities/requests';
    import Password from './Password.svelte';
    // import Recaptcha from './Recaptcha.svelte';

    export let title: string;
    document.title = title + ': Sign up';
    export let username: string = '';
    export let password: string = '';
    export let confirmPassword: string = '';
    export let email: string = '';
    export let firstName: string = '';
    export let lastName: string = '';

    let i: HTMLInputElement,
        recaptcha = false;
    const submit = () => {
        // if (i.value || !recaptcha) {
    //     return;
    // }
        if (i.value) return;
        if (!valid) {
            console.log('Is not valid');
        }

        // ServerRequest.post('/account/sign-up', {
    //     username,
    //     password,
    //     confirmPassword,
    //     email,
    //     firstName,
    //     lastName
    // });

        Accounts.signUp({
            username,
            password,
            confirmPassword,
            email,
            firstName,
            lastName
        });
    };

    const isValid = (
        username: string,
        password: string,
        confirmPassword: string
    ) => {
        return (
            isUsernameValid(username) &&
            isPasswordValid(password).length === 0 &&
            password === confirmPassword
        );
    };

    const isUsernameValid = (username: string): boolean => {
        if (username.includes('@')) {
            return !!(
                username.split('@')[1]?.split('.')[0]?.length &&
                username.split('@')[1]?.split('.')[1]?.length &&
                username.split('@')[1]?.split('.')[
                    username.split('@')[1]?.split('.').length - 1
                ]?.length
            );
        }
        return username.length > 5;
    };

    let valid = false;

    const onInput = () => {
        valid = isValid(username, password, confirmPassword);
    };

    const isPasswordValid = (password: string): string[] => {
        const output = [];
        if (password.length < 8) output.push('8 characters long');
        if (!password.match(/[a-z]/)) output.push('1 lowercase letter');
        if (!password.match(/[A-Z]/)) output.push('1 uppercase letter');
        if (!password.match(/[0-9]/)) output.push('1 number');
        if (!password.match(/[^a-zA-Z\d]/)) output.push('1 special character');
        return output;
    };
</script>

<main>
    <div class="container pt-5">
        <div class="row">
            <div class="col-md-6">
                <div class="row mb-3">
                    <h1>
                        {title}: Sign up
                    </h1>
                </div>

                <div class="row mb-3">
                    <a
                        class="link-primary nav-link"
                        href="/account/sign-in"
                    >Sign In</a
                    >
                </div>
                <form on:submit|preventDefault="{submit}">
                    <div class="mb-3 form-floating">
                        <input
                            id="username"
                            name="username"
                            class="form-control"
                            placeholder="Username"
                            type="text"
                            bind:value="{username}"
                            on:input="{onInput}"
                        />
                        <label
                            class="form-label"
                            for="username">Username</label
                        >
                        {#if username.length > 0}
                            {#if !isUsernameValid(username)}
                                <small class="text-danger">
                                    Invalid username
                                </small>
                            {/if}
                        {/if}
                    </div>

                    <div class="mb-3 form-floating">
                        <input
                            id="email"
                            name="email"
                            class="form-control"
                            placeholder="Email"
                            type="text"
                            bind:value="{email}"
                            on:input="{onInput}"
                        />
                        <label
                            class="form-label"
                            for="email">Email</label>
                        {#if email.length > 0}
                            {#if email.includes('@')}
                                {#if email.split('@')[1]?.split('.')[0]?.length}
                                    {#if !email
                                        .split('@')[1]
                                        ?.split('.')[1]?.length || !email
                                            .split('@')[1]
                                            ?.split('.')[email
                                                .split('@')[1]
                                                ?.split('.').length - 1]?.length}
                                        <small class="text-danger">
                                            Invalid email extension
                                        </small>
                                    {/if}
                                {:else}
                                    <small class="text-danger">
                                        Invalid email domain
                                    </small>
                                {/if}
                            {:else}
                                <small class="text-danger">
                                    Invalid email
                                </small>
                            {/if}
                        {/if}
                    </div>

                    <div class="mb-3 form-floating">
                        <input
                            id="firstName"
                            name="firstName"
                            class="form-control"
                            placeholder="First Name"
                            type="text"
                            bind:value="{firstName}"
                            on:input="{onInput}"
                        />
                        <label
                            class="form-label"
                            for="firstName"
                        >First Name</label
                        >
                    </div>
                    <div class="mb-3 form-floating">
                        <input
                            id="lastName"
                            name="lastName"
                            class="form-control"
                            placeholder="Last Name"
                            type="text"
                            bind:value="{lastName}"
                            on:input="{onInput}"
                        />
                        <label
                            class="form-label"
                            for="lastName"
                        >Last Name</label
                        >
                    </div>
                    <div class="mb-3 form-floating">
                        <!-- <input
                        class="form-control"
                        type="password"
                        name="password"
                        id="password"
                        bind:value="{password}"
                        placeholder="Password"
                        on:input="{onInput}"
                    />
                    <label class="form-label" for="password">Password</label> -->
                        <Password
                            label="Password"
                            placeholder="Password"
                            bind:value="{password}"
                            on:input="{onInput}"
                        />
                        {#if isPasswordValid(password).length > 0}
                            <small class="text-danger">
                                Password must have the following properties:
                                <ul>
                                    {#each isPasswordValid(password) as property}
                                        <li>{property}</li>
                                    {/each}
                                </ul>
                            </small>
                        {:else}
                            <small class="text-success"> Looks good! </small>
                        {/if}
                    </div>
                    <div class="mb-3 form-floating">
                        <!-- <input
                        class="form-control"
                        type="password"
                        name="confirmPassword"
                        id="confirmPassword"
                        bind:value="{confirmPassword}"
                        placeholder="Password"
                        on:input="{onInput}"
                    />
                    <label class="form-label" for="confirmPassword"
                        >Confirm Password</label
                    > -->
                        <Password
                            label="Confirm Password"
                            placeholder="Confirm Password"
                            bind:value="{confirmPassword}"
                            on:input="{onInput}"
                        />
                        {#if password.length > 0}
                            {#if password !== confirmPassword}
                                <small class="text-danger">
                                    Passwords do not match
                                </small>
                            {:else}
                                <small class="text-success">
                                    Looks good!
                                </small>
                            {/if}
                        {/if}
                    </div>

                    <hr />

                    <input
                        class="btn btn-primary"
                        disabled="{!valid}"
                        type="submit"
                        value="Submit"
                        on:click|preventDefault="{submit}"
                    />

                    <input
                        bind:this="{i}"
                        id="email"
                        name="confirm-email"
                        class="d-none"
                        type="text"
                    />
                    <!-- <Recaptcha
                        on:recaptcha="{() => {
                            recaptcha = true;
                        }}"
                    /> -->
                </form>
            </div>
        </div>
    </div>
</main>
