import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import org.springframework.boot.gradle.tasks.bundling.BootJar
import org.springframework.boot.gradle.tasks.run.BootRun

plugins {
    id("org.springframework.boot") version "2.7.11"
    id("io.spring.dependency-management") version "1.1.0"
    kotlin("jvm") version "1.7.22"
    kotlin("plugin.spring") version "1.7.22"
}

group = "fi.oph"
version = "0.0.1-SNAPSHOT"
java.sourceCompatibility = JavaVersion.VERSION_17

repositories {
    mavenCentral()
    maven(url = "https://artifactory.opintopolku.fi/artifactory/oph-sade-snapshot-local") {
        mavenContent {
            snapshotsOnly()
        }
    }
    maven(url = "https://artifactory.opintopolku.fi/artifactory/oph-sade-release-local") {
        mavenContent {
            releasesOnly()
        }
    }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.security:spring-security-cas")
    implementation("org.springframework.session:spring-session-jdbc")
    implementation("fi.vm.sade.java-utils:opintopolku-cas-servlet-filter:0.1.2-SNAPSHOT")
    implementation("fi.vm.sade.java-utils:opintopolku-user-details-service:0.2.0-SNAPSHOT")
    implementation("fi.vm.sade.java-utils:java-utils:0.3.0-SNAPSHOT")
    implementation("io.github.cdimascio:dotenv-kotlin:6.4.1")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.15.2")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.15.2")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.flywaydb:flyway-core:9.16.1")
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation("software.amazon.awssdk:s3:2.20.56")
    implementation("software.amazon.awssdk:sso:2.20.56")
    implementation("software.amazon.awssdk:ssooidc:2.20.56")
    runtimeOnly("org.postgresql:postgresql:42.6.0")
    developmentOnly("org.springframework.boot:spring-boot-devtools")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs = listOf("-Xjsr305=strict")
        jvmTarget = "17"
    }
}

val buildWeb = tasks.register("buildWeb") {
    dependsOn(tasks.withType<KotlinCompile>())

    doLast {
        val pathToStatic = "../server/build/resources/main/static"
        File(pathToStatic).deleteRecursively()
        exec {
            workingDir("../web")
            commandLine("sh", "-c", "yarn && yarn build")
        }
    }
}

tasks.withType<BootJar> {
    dependsOn(buildWeb)
}
tasks.withType<BootRun> {
    dependsOn(buildWeb)
}

tasks.withType<Test> {
    useJUnitPlatform()
    systemProperty("spring.profiles.active", "local")
    testLogging {
        showStandardStreams = true
    }
}
