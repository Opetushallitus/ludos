import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import org.springframework.boot.gradle.tasks.bundling.BootJar
import org.springframework.boot.gradle.tasks.run.BootRun

plugins {
    id("org.springframework.boot") version "3.3.1"
    id("io.spring.dependency-management") version "1.1.6"
    kotlin("jvm") version "1.9.22"
    kotlin("plugin.spring") version "1.9.22"
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
    implementation("io.arrow-kt:arrow-core:1.2.1")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.17.2")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.17.2")
    implementation("fi.vm.sade.java-utils:java-http:1.0.0-SNAPSHOT")
    implementation("io.github.cdimascio:dotenv-kotlin:6.4.1")
    implementation("jakarta.servlet:jakarta.servlet-api:6.1.0")
    implementation("ch.qos.logback:logback-access:1.4.14")
    implementation("net.logstash.logback:logstash-logback-encoder:7.4")
    implementation("org.flywaydb:flyway-core:10.6.0")
    implementation("org.flywaydb:flyway-database-postgresql:10.6.0")
    implementation("org.jetbrains.kotlin:kotlin-reflect:1.9.22")
    implementation("org.jsoup:jsoup:1.18.1")
    implementation("org.springframework.security:spring-security-cas:6.3.1")
    implementation("org.springframework:spring-test:6.1.11")
    implementation("software.amazon.awssdk:cloudwatchlogs:2.26.19")
    implementation("software.amazon.awssdk:s3:2.26.19")
    implementation("software.amazon.awssdk:sso:2.26.19")
    implementation("software.amazon.awssdk:ssooidc:2.26.19")
    implementation(Spring.boot.cache)
    implementation(Spring.boot.data.jpa)
    implementation(Spring.boot.security)
    implementation(Spring.boot.validation)
    implementation(Spring.boot.web)
    implementation(Spring.session.jdbc)
    implementation("org.postgresql:postgresql:42.7.1")
    testImplementation("org.reflections:reflections:0.10.2")
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
