import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

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
    implementation("fi.vm.sade.java-utils:opintopolku-cas-servlet-filter:0.1.2-SNAPSHOT")
    implementation("fi.vm.sade.java-utils:opintopolku-user-details-service:0.2.0-SNAPSHOT")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.flywaydb:flyway-core:9.16.1")
    implementation("org.springframework.boot:spring-boot-starter-cache")
    runtimeOnly("org.postgresql:postgresql:42.6.0")
    developmentOnly("org.springframework.boot:spring-boot-devtools")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

val ensureStaticFolderExistsTask = task<Exec>("buildWeb") {
    workingDir("../web")
    commandLine("bash", "-c", "if [ ! -d ../server/build/resources/main/static ]; then yarn && yarn build; fi")
}

tasks.withType<KotlinCompile> {
    dependsOn(ensureStaticFolderExistsTask)
    kotlinOptions {
        freeCompilerArgs = listOf("-Xjsr305=strict")
        jvmTarget = "17"
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
    systemProperty("spring.profiles.active", "local")
}
