<script lang="ts">
    import { Random } from '../../../../shared/math';
    import { abbreviate } from '../../../../shared/text';
    import { createEventDispatcher } from 'svelte';
    import type { Picture } from '../../../utilities/general-types';

    const id = 'input-' + Random.uuid();
    let input: HTMLInputElement;
    export let multiple: boolean = true;

    let pictures: Picture[] = [];

    const dispatch = createEventDispatcher();

    $: dispatch('change', pictures);

    const onInput = async (e: Event) => {
        const { files } = input;
        if (files) {
            pictures = [
                ...(multiple ? pictures : []),
                ...(await Promise.all(
                    Array.from(files).map(
                        f =>
                            new Promise<Picture>((res, rej) => {
                                const reader = new FileReader();
                                reader.onload = async () =>
                                    res({
                                        url: reader.result as string,
                                        file: f
                                    });
                                reader.onerror = rej;
                                reader.readAsDataURL(f);
                            })
                    )
                ))
            ];
        }
    };
    const remove = (p: Picture) => {
        pictures = pictures.filter(p2 => p2 !== p);
    };
</script>

<div class="container-fluid">
    <div class="row mb-3">
        <input
            bind:this="{input}"
            {id}
            name=""
            class="form-control"
            accept=".png,.PNG,.jpg,.JPG,.jpeg,.JPEG"
            {multiple}
            type="file"
            on:change="{onInput}"
        />
    </div>
    <div class="row">
        {#each pictures as picture, i}
            <div class="col-sm-4 col-md-3 col-lg-2 m-1 no-select">
                <div class="d-flex justify-content-between align-items-center py-1"
                >
                    <p class="p-0 m-0">
                        {abbreviate(picture.file.name, 20)}
                    </p>
                    <i
                        class="material-icons text-danger cursor-pointer p-0 m-0"
                        on:click="{() => remove(picture)}"
                    >
                        close
                    </i>
                </div>
                <img
                    class="img-thumbnail p-1"
                    alt="picture {i}"
                    src="{picture.url}"
                />
            </div>
        {/each}
    </div>
</div>
