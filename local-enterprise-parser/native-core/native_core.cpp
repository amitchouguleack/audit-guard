#include "native_core.h"
#include <regex>
#include <algorithm>
#include <cstring>

NativeScanner::NativeScanner() {
    patterns_ = {
        {"pii_ssn", R"(\b\d{3}-\d{2}-\d{4}\b)", "critical"},
        {"pii_ssn_no_dash", R"(\b\d{9}\b)", "high"},
        {"pii_email", R"(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b)", "medium"},
        {"pii_phone", R"(\b(?:\+1)?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b)", "low"},
        {"credential_password", R"((?i)(?:password|passwd|pwd)\s*[:=]\s*\S+)", "critical"},
        {"credential_bearer", R"((?i)bearer\s+[A-Za-z0-9\-._~+/]+=*)", "critical"},
        {"credential_api_key", R"((?i)(?:api[_-]?key|apikey)\s*[:=]\s*['\"]?[A-Za-z0-9\-._]{20,}['\"]?)", "high"},
        {"credential_private_key", R"(-----BEGIN (?:RSA |EC )?PRIVATE KEY-----)", "critical"}
    };
}

NativeScanner::~NativeScanner() {}

std::vector<MatchResult> NativeScanner::scan(const char* content, size_t length) {
    std::vector<MatchResult> results;
    std::string text(content, length);

    for (const auto& pattern : patterns_) {
        try {
            std::regex re(pattern.regex, std::regex::icase);
            auto words_begin = std::sregex_iterator(text.begin(), text.end(), re);
            auto words_end = std::sregex_iterator();

            for (std::sregex_iterator i = words_begin; i != words_end; ++i) {
                std::smatch match = *i;
                MatchResult result;
                result.pattern_type = pattern.name;
                result.severity = pattern.severity;
                result.matched_text = match.str();
                result.start_offset = match.position();
                result.end_offset = match.position() + match.length();
                results.push_back(result);
            }
        } catch (const std::regex_error&) {
            continue;
        }
    }

    std::sort(results.begin(), results.end(),
        [](const MatchResult& a, const MatchResult& b) {
            return a.start_offset < b.start_offset;
        });

    return results;
}

void NativeScanner::add_pattern(const std::string& name, const std::string& regex, const std::string& severity) {
    patterns_.push_back({name, regex, severity});
}

extern "C" {
    NativeScanner* create_scanner() {
        return new NativeScanner();
    }

    void destroy_scanner(NativeScanner* scanner) {
        delete scanner;
    }

    MatchResult* scan_content(NativeScanner* scanner, const char* content, size_t length, size_t* result_count) {
        if (!scanner || !content || !result_count) {
            *result_count = 0;
            return nullptr;
        }

        auto results = scanner->scan(content, length);
        *result_count = results.size();

        if (results.empty()) {
            return nullptr;
        }

        MatchResult* arr = new MatchResult[results.size()];
        std::copy(results.begin(), results.end(), arr);
        return arr;
    }

    void free_results(MatchResult* results, size_t count) {
        delete[] results;
    }
}
