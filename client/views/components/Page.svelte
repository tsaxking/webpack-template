<script lang="ts">
    import { Container, Row, Col } from 'sveltestrap';
    export let title: string;
    let year: number = new Date().getFullYear();
    export let domain: string;
</script>

<Container fluid>
    <Row>
        <h1 class="text-capitalize no-select">{title}</h1>
    </Row>
    <Row>
        <slot></slot>
    </Row>
    <Row>
        <Col>
            <br>
            <hr class="dropdown-divider">
            <p class="text-muted text-center">
                &copy; {year} {domain} | All Rights Reserved
            </p>
        </Col>
    </Row>
</Container>