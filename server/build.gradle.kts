import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import org.springframework.boot.gradle.tasks.bundling.BootJar
import org.springframework.boot.gradle.tasks.run.BootRun

plugins {
    id("org.springframework.boot")
    id("io.spring.dependency-management")
    kotlin("jvm")
    kotlin("plugin.spring")
}

group = "fi.oph"
version = "0.0.1-SNAPSHOT"
java.sourceCompatibility = JavaVersion.VERSION_17

repositories {
    mavenCentral()
    maven(url = "https://maven.pkg.github.com/Opetushallitus/java-utils") {
        credentials {
            username = "does-not-matter"
            password = project.findProperty("gpr.key") as String? ?: System.getenv("GITHUB_TOKEN")
        }
    }
}

dependencies {
    developmentOnly(Spring.boot.devTools)
    implementation("io.arrow-kt:arrow-core:_")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:_")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:_")
    implementation("fi.vm.sade.java-utils:java-http:_")
    implementation("io.github.cdimascio:dotenv-kotlin:_")
    implementation("jakarta.servlet:jakarta.servlet-api:_")
    implementation("ch.qos.logback:logback-access:_")
    implementation("net.logstash.logback:logstash-logback-encoder:_")
    implementation("org.flywaydb:flyway-core:_")
    implementation("org.flywaydb:flyway-database-postgresql:_")
    implementation("org.jetbrains.kotlin:kotlin-reflect:_")
    implementation("org.jsoup:jsoup:_")
    implementation("org.springframework.security:spring-security-cas:_")
    implementation("org.springframework:spring-test:_")
    implementation("software.amazon.awssdk:cloudwatchlogs:_")
    implementation("software.amazon.awssdk:s3:_")
    implementation("software.amazon.awssdk:sso:_")
    implementation("software.amazon.awssdk:ssooidc:_")
    implementation(Spring.boot.cache)
    implementation(Spring.boot.data.jpa)
    implementation(Spring.boot.security)
    implementation(Spring.boot.validation)
    implementation(Spring.boot.web)
    implementation(Spring.session.jdbc)
    implementation("org.postgresql:postgresql:_")
    testImplementation("org.reflections:reflections:_")
    testImplementation(Spring.boot.test)
    testImplementation(Spring.security.spring_security_test)
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs = listOf("-Xjsr305=strict")
        jvmTarget = "17"
    }
}

val pathToStatic = "server/build/resources/main/static"

val linkJar = tasks.register("linkJar") {
    mustRunAfter(tasks.withType<BootJar>())

    doLast {
        exec {
            workingDir("build/libs")
            commandLine("ln", "-vf", "ludos-${version}.jar", "ludos.jar")
        }
    }
}

tasks.withType<BootJar> {
    dependsOn(tasks.withType<KotlinCompile>())
    finalizedBy(linkJar)
}

tasks.withType<BootRun> {
    dependsOn(tasks.withType<KotlinCompile>())
}

tasks.withType<Test> {
    dependsOn(tasks.withType<KotlinCompile>())
    useJUnitPlatform()
    systemProperty("spring.profiles.active", "local")
    testLogging {
        showStandardStreams = true
    }
}
